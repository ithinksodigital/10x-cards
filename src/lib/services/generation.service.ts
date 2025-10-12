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
    // TODO: Implement actual Edge Function call or job enqueue
    // For now, this is a placeholder that logs the intent
    console.log("Enqueueing generation job:", {
      generationId,
      language: command.language,
      targetCount: command.target_count,
    });

    // Example Edge Function call (to be implemented):
    // const edgeFunctionUrl = import.meta.env.SUPABASE_EDGE_FUNCTION_URL;
    // await fetch(`${edgeFunctionUrl}/generate-flashcards`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${import.meta.env.SUPABASE_SERVICE_ROLE_KEY}`
    //   },
    //   body: JSON.stringify({
    //     generation_id: generationId,
    //     language: command.language,
    //     target_count: command.target_count
    //   })
    // });

    // Note: The actual AI processing will:
    // 1. Fetch the generation record by ID
    // 2. Process the source_text with AI model
    // 3. Update generation record with results
    // 4. Create card records
    // 5. Handle errors and log to generation_error_logs if needed
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
}
