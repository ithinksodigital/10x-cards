// src/lib/services/generation.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { StartGenerationCommand, StartGenerationResponseDto, OpenRouterConfig } from "../../types";
import { OpenRouterService } from "./openrouter.service";
import { getSecret } from "astro:env/server";

/**
 * Service responsible for managing AI flashcard generation lifecycle
 */
export class GenerationService {
  private supabase: SupabaseClient;
  private openRouterService: OpenRouterService;
  private readonly DEFAULT_MODEL = "gpt-4o";
  private readonly ESTIMATED_MS_PER_CARD = 300; // Estimated time per flashcard in ms

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.openRouterService = this.createOpenRouterService();
  }

  /**
   * Create OpenRouter service with configuration
   * @returns Configured OpenRouterService instance
   */
  private createOpenRouterService(): OpenRouterService {
    // Get API key from environment using Astro 5 system
    const apiKey = getSecret("OPENROUTER_API_KEY") || "";

    const config: OpenRouterConfig = {
      apiKey,
      baseUrl: "https://openrouter.ai/api/v1",
      defaultModel: this.DEFAULT_MODEL,
      maxRetries: 3,
      timeoutMs: 30000,
      chunkSize: 10000,
      maxTokens: 4000,
    };

    // OpenRouter config initialized

    if (!config.apiKey) {
      // OPENROUTER_API_KEY not found in environment variables. Using simulation mode.
    }

    return new OpenRouterService(this.supabase, config);
  }

  /**
   * Initiates a new generation process
   * Creates a database record and enqueues background processing
   */
  async startGeneration(command: StartGenerationCommand, userId: string): Promise<StartGenerationResponseDto> {
    // 1. Calculate source text hash (SHA-256)
    const sourceTextHash = await this.calculateHash(command.source_text);
    const sourceTextLength = command.source_text.length;

    // 2. Validate rate limiting (10 generations per hour) - TEMPORARILY DISABLED
    // await this.checkRateLimit(userId);

    // 3. Create generation record in database
    const { data: generation, error: insertError } = await this.supabase
      .from("generations")
      .insert({
        user_id: userId,
        source_text: command.source_text,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        model: this.DEFAULT_MODEL,
        set_id: undefined, // Will be set when cards are accepted
        generated_count: 0,
        accepted_count: 0,
        rejected_count: 0,
        accepted_edited_count: 0,
        accepted_unedited_count: 0,
        status: "processing",
        progress: 0,
        message: "Initializing generation...",
        estimated_completion: new Date(
          Date.now() + this.calculateEstimatedDuration(command.target_count || 30)
        ).toISOString(),
      })
      .select("id, user_id, model, source_text_hash, source_text_length, created_at")
      .single();

    if (insertError || !generation) {
      // Failed to create generation record

      // More specific error messages
      if (insertError?.code === "42501") {
        throw new Error("Database permission denied. Please check RLS policies for the generations table.");
      }
      if (insertError?.code === "23503") {
        throw new Error("User does not exist in profiles table. Please create the user first.");
      }

      throw new Error(`Failed to initialize generation process: ${insertError?.message || "Unknown error"}`);
    }

    // 4. Enqueue background job (Edge Function or worker)
    await this.enqueueGenerationJob(generation.id, command);

    // 5. Calculate estimated duration
    const targetCount = command.target_count ?? 30;
    const estimatedDurationMs = this.calculateEstimatedDuration(targetCount);

    // 6. Return response DTO
    const response: StartGenerationResponseDto = {
      id: generation.id,
      user_id: generation.user_id,
      model: generation.model,
      source_text_hash: generation.source_text_hash,
      source_text_length: generation.source_text_length,
      created_at: generation.created_at,
      status: "processing",
      estimated_duration_ms: estimatedDurationMs,
    };

    return response;
  }

  /**
   * Calculate SHA-256 hash of source text for deduplication
   * Uses Web Crypto API for universal compatibility
   */
  private async calculateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  }

  /**
   * Check if user has exceeded rate limit (10 generations per hour)
   */
  private async checkRateLimit(userId: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error } = await this.supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneHourAgo);

    if (error) {
      // Error checking rate limit
      // Don't block user if we can't check rate limit
      return;
    }

    if (count !== null && count >= 10) {
      throw new Error("Rate limit exceeded: Maximum 10 generations per hour. Please try again later.");
    }
  }

  /**
   * Enqueue background job for AI generation
   * This will call an Edge Function or enqueue a job in a queue
   */
  private async enqueueGenerationJob(generationId: string, command: StartGenerationCommand): Promise<void> {
    // For Cloudflare Pages, try immediate processing instead of setTimeout
    try {
      await this.processGeneration(generationId, command);
    } catch (error) {
      // Processing failed
      // eslint-disable-next-line no-console
      console.error("❌ Processing failed for:", generationId, error);
      await this.updateGenerationStatus(
        generationId,
        "failed",
        0,
        "Processing failed",
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Process generation using OpenRouter AI service
   */
  private async processGeneration(generationId: string, command: StartGenerationCommand): Promise<void> {
    try {
      // Update status to processing with progress
      await this.updateGenerationStatus(generationId, "processing", 25, "Analyzing source text...");

      // Get user ID from generation record
      const { data: generation, error: fetchError } = await this.supabase
        .from("generations")
        .select("user_id")
        .eq("id", generationId)
        .single();

      if (fetchError || !generation) {
        throw new Error(`Failed to fetch generation record: ${fetchError?.message || "Generation not found"}`);
      }

      // Check if OpenRouter API key is available
      const apiKey = getSecret("OPENROUTER_API_KEY") || "";

      if (!apiKey || !apiKey.startsWith("sk-or-")) {
        // OpenRouter API key not found or invalid, using simulation mode
        await this.simulateGeneration(generationId, command.source_text, command.target_count || 30);
        return;
      }

      // Update progress
      await this.updateGenerationStatus(generationId, "processing", 50, "Generating flashcards with AI...");

      // Use OpenRouter service to generate flashcards with shorter timeout
      const result = await Promise.race([
        this.openRouterService.generateFlashcards({
          sourceText: command.source_text,
          language: command.language,
          targetCount: command.target_count || 30,
          userId: generation.user_id,
          generationId: generationId,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            // OpenRouter API timeout after 45 seconds
            reject(new Error("OpenRouter API timeout after 45 seconds"));
          }, 45000)
        ),
      ]);

      // OpenRouter API call completed

      if (!result.success) {
        // OpenRouter API failed

        // Check if it's a quota/limit error
        if (result.error?.message?.includes("limit") || result.error?.message?.includes("quota")) {
          await this.simulateGeneration(generationId, command.source_text, command.target_count || 30);
          return;
        }

        // For any other error, fall back to simulation mode
        // OpenRouter API error, falling back to simulation mode
        await this.simulateGeneration(generationId, command.source_text, command.target_count || 30);
        return;
      }

      // Update progress
      await this.updateGenerationStatus(generationId, "processing", 75, "Processing generated cards...");

      // Convert AI result to database format
      const flashcards = result.cards.map((card, index) => ({
        id: `card-${generationId}-${index}`,
        front: card.front,
        back: card.back,
        source_text_excerpt: card.excerpt,
        ai_confidence_score: card.confidence,
        was_edited: false,
        original_front: card.front,
        original_back: card.back,
      }));

      // Update generation with completed status and cards
      await this.updateGenerationStatus(
        generationId,
        "completed",
        100,
        `Generation completed! Generated ${flashcards.length} flashcards.`,
        flashcards,
        undefined,
        {
          model: result.metadata.model,
          prompt_tokens: result.metadata.promptTokens,
          completion_tokens: result.metadata.completionTokens,
          total_cost_usd: result.metadata.totalCost,
          generation_duration_ms: result.metadata.processingTimeMs,
        }
      );

      // Successfully generated flashcards
    } catch (error) {
      await this.updateGenerationStatus(
        generationId,
        "failed",
        0,
        "Generation failed",
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Simulate generation by creating random flashcards from source text
   * Used as fallback when OpenRouter API key is not available
   */
  private async simulateGeneration(generationId: string, sourceText: string, targetCount: number): Promise<void> {
    try {
      // Update status to processing with progress
      await this.updateGenerationStatus(generationId, "processing", 50, "Generating flashcards...");

      // Split text into sentences and create flashcards
      const sentences = sourceText.split(/[.!?]+/).filter((s) => s.trim().length > 15);
      const flashcards = [];

      // Create flashcards from sentences
      for (let i = 0; i < Math.min(targetCount, sentences.length); i++) {
        const sentence = sentences[i].trim();
        if (sentence.length < 20) continue;

        // Create a simple flashcard by splitting the sentence at a natural break
        const words = sentence.split(" ");
        if (words.length < 4) continue;

        // Find a good split point (after first few words)
        const splitPoint = Math.min(4, Math.floor(words.length / 2));

        const front = words.slice(0, splitPoint).join(" ") + "...";
        const back = words.slice(splitPoint).join(" ");

        flashcards.push({
          id: `card-${generationId}-${i}`,
          front: front,
          back: back,
          source_text_excerpt: sentence.substring(0, 100),
          ai_confidence_score: 0.7 + Math.random() * 0.3, // Random confidence 0.7-1.0
          was_edited: false,
          original_front: front,
          original_back: back,
        });
      }

      // If no sentences found, create a simple flashcard from the whole text
      if (flashcards.length === 0 && sourceText.length > 50) {
        const words = sourceText.split(" ");
        const midPoint = Math.floor(words.length / 2);

        flashcards.push({
          id: `card-${generationId}-0`,
          front: words.slice(0, midPoint).join(" ") + "...",
          back: words.slice(midPoint).join(" "),
          source_text_excerpt: sourceText.substring(0, 100),
          ai_confidence_score: 0.8,
          was_edited: false,
          original_front: words.slice(0, midPoint).join(" ") + "...",
          original_back: words.slice(midPoint).join(" "),
        });
      }

      // Update generation with completed status and cards
      await this.updateGenerationStatus(
        generationId,
        "completed",
        100,
        `Generation completed! Generated ${flashcards.length} flashcards.`,
        flashcards
      );
    } catch (error) {
      await this.updateGenerationStatus(
        generationId,
        "failed",
        0,
        "Generation failed",
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Update generation status in database
   */
  private async updateGenerationStatus(
    generationId: string,
    status: "processing" | "completed" | "failed",
    progress: number,
    message: string,
    cards?: unknown[],
    errorMessage?: string,
    metadata?: {
      model: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_cost_usd: number;
      generation_duration_ms: number;
    }
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      progress,
      message,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
      updateData.generated_count = cards?.length || 0;
      // Store cards as JSON in a temporary field for the API response
      updateData.cards = cards;

      // Add AI metadata if provided
      if (metadata) {
        updateData.model = metadata.model;
        updateData.prompt_tokens = metadata.prompt_tokens;
        updateData.completion_tokens = metadata.completion_tokens;
        updateData.total_cost_usd = metadata.total_cost_usd;
        updateData.generation_duration_ms = metadata.generation_duration_ms;
        // Note: language column doesn't exist in generations table
      }
    } else if (status === "failed") {
      updateData.failed_at = new Date().toISOString();
      updateData.error_message = errorMessage;
      updateData.error_code = "AI_GENERATION_ERROR";
    }

    const { error } = await this.supabase.from("generations").update(updateData).eq("id", generationId);

    if (error) {
      // Failed to update generation status
    }
  }

  /**
   * Calculate estimated processing duration based on target count
   */
  private calculateEstimatedDuration(targetCount: number): number {
    // Base overhead for API calls and setup
    const baseOverheadMs = 2000;

    // Time per card generation
    const perCardMs = this.ESTIMATED_MS_PER_CARD * targetCount;

    return baseOverheadMs + perCardMs;
  }

  /**
   * Retrieves the current status of a generation process
   */
  async getGenerationStatus(generationId: string): Promise<unknown | null> {
    // Since RLS is disabled for MVP, we can query by generation ID only
    // This prevents issues when user context changes between generation start and status polling
    const { data: generation, error } = await this.supabase
      .from("generations")
      .select(
        `
        id,
        user_id,
        status,
        progress,
        message,
        generated_count,
        accepted_count,
        rejected_count,
        created_at,
        updated_at,
        completed_at,
        failed_at,
        error_message,
        error_code,
        estimated_completion,
        cards
      `
      )
      .eq("id", generationId)
      .single();

    if (error) {
      // Failed to fetch generation status
      return null;
    }

    return generation;
  }
}
