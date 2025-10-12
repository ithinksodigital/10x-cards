// src/lib/services/generation.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { StartGenerationCommand, StartGenerationResponseDto } from "../../types";

/**
 * Service responsible for managing AI flashcard generation lifecycle
 */
export class GenerationService {
  private supabase: SupabaseClient;
  private readonly DEFAULT_MODEL = "gpt-4o";
  private readonly ESTIMATED_MS_PER_CARD = 300; // Estimated time per flashcard in ms

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Initiates a new generation process
   * Creates a database record and enqueues background processing
   */
  async startGeneration(command: StartGenerationCommand, userId: string): Promise<StartGenerationResponseDto> {
    // 1. Calculate source text hash (SHA-256)
    const sourceTextHash = await this.calculateHash(command.source_text);
    const sourceTextLength = command.source_text.length;

    // 2. Validate rate limiting (10 generations per hour)
    await this.checkRateLimit(userId);

    // 3. Create generation record in database
    const { data: generation, error: insertError } = await this.supabase
      .from("generations")
      .insert({
        user_id: userId,
        source_text: command.source_text,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        model: this.DEFAULT_MODEL,
        set_id: null, // Will be set when cards are accepted
        generated_count: 0,
        accepted_count: 0,
        rejected_count: 0,
        accepted_edited_count: 0,
        accepted_unedited_count: 0,
        status: 'processing',
        progress: 0,
        message: 'Initializing generation...',
        estimated_completion: new Date(Date.now() + this.calculateEstimatedDuration(command.target_count || 30)).toISOString(),
      })
      .select("id, user_id, model, source_text_hash, source_text_length, created_at")
      .single();

    if (insertError || !generation) {
      console.error("Failed to create generation record:", {
        error: insertError,
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
        userId,
      });

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
      console.error("Error checking rate limit:", {
        error,
        code: error?.code,
        message: error?.message,
      });
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
    console.log("Starting simulated generation:", {
      generationId,
      language: command.language,
      targetCount: command.target_count,
    });

    // Simulate processing time (2-5 seconds)
    const processingTime = 2000 + Math.random() * 3000;
    
    setTimeout(async () => {
      await this.simulateGeneration(generationId, command.source_text, command.target_count || 30);
    }, processingTime);
  }

  /**
   * Simulate generation by creating random flashcards from source text
   */
  private async simulateGeneration(generationId: string, sourceText: string, targetCount: number): Promise<void> {
    try {
      // Update status to processing with progress
      await this.updateGenerationStatus(generationId, 'processing', 50, 'Generating flashcards...');

      // Split text into sentences and create random flashcards
      const sentences = sourceText.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const flashcards = [];

      for (let i = 0; i < Math.min(targetCount, sentences.length); i++) {
        const sentence = sentences[i].trim();
        if (sentence.length < 20) continue;

        // Create a simple flashcard by splitting the sentence
        const words = sentence.split(' ');
        const midPoint = Math.floor(words.length / 2);
        
        const front = words.slice(0, midPoint).join(' ') + '...';
        const back = words.slice(midPoint).join(' ');

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

      // Update generation with completed status and cards
      await this.updateGenerationStatus(generationId, 'completed', 100, 'Generation completed!', flashcards);

      console.log(`Generated ${flashcards.length} flashcards for generation ${generationId}`);

    } catch (error) {
      console.error('Simulation generation failed:', error);
      await this.updateGenerationStatus(generationId, 'failed', 0, 'Generation failed', null, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Update generation status in database
   */
  private async updateGenerationStatus(
    generationId: string, 
    status: 'processing' | 'completed' | 'failed',
    progress: number,
    message: string,
    cards?: any[],
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      progress,
      message,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.generated_count = cards?.length || 0;
      // Store cards as JSON in a temporary field for the API response
      updateData.cards = cards;
    } else if (status === 'failed') {
      updateData.failed_at = new Date().toISOString();
      updateData.error_message = errorMessage;
      updateData.error_code = 'SIMULATION_ERROR';
    }

    const { error } = await this.supabase
      .from('generations')
      .update(updateData)
      .eq('id', generationId);

    if (error) {
      console.error('Failed to update generation status:', error);
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
  async getGenerationStatus(generationId: string, userId: string): Promise<any | null> {
    const { data: generation, error } = await this.supabase
      .from("generations")
      .select(`
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
      `)
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch generation status:", error);
      return null;
    }

    return generation;
  }
}
