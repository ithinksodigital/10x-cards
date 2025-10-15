// src/pages/api/generations/[id].ts
import type { APIContext } from "astro";
import { GenerationService } from "@/lib/services/generation.service";
import type { ProcessingGenerationDto, CompletedGenerationDto, FailedGenerationDto, ErrorResponseDto } from "@/types";

export const prerender = false;

/**
 * GET /api/generations/[id]
 * Retrieves the current status of a generation process.
 * Returns generation metadata with current status (processing, completed, or failed).
 */
export async function GET(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase;
  const generationId = context.params.id;

  if (!generationId) {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Generation ID is required",
      timestamp: new Date().toISOString(),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if user is authenticated, otherwise use anonymous ID
  const user = context.locals.user;
  const userId = user ? user.id : "anonymous-user";

  try {
    const generationService = new GenerationService(supabase);
    const generation = await generationService.getGenerationStatus(generationId, userId);

    if (!generation) {
      const errorResponse: ErrorResponseDto = {
        error: "NotFound",
        message: `Generation with ID ${generationId} not found`,
        timestamp: new Date().toISOString(),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert database record to API response format
    let responseData: ProcessingGenerationDto | CompletedGenerationDto | FailedGenerationDto;

    if (generation.status === "processing") {
      responseData = {
        id: generation.id,
        status: "processing",
        progress: generation.progress || 0,
        message: generation.message || "Processing your text...",
        created_at: generation.created_at,
        estimated_completion: generation.estimated_completion,
      } as ProcessingGenerationDto;
    } else if (generation.status === "completed") {
      responseData = {
        id: generation.id,
        status: "completed",
        generated_count: generation.generated_count || 0,
        accepted_count: generation.accepted_count || 0,
        rejected_count: generation.rejected_count || 0,
        created_at: generation.created_at,
        completed_at: generation.completed_at,
        cards: generation.cards || [],
      } as CompletedGenerationDto;
    } else if (generation.status === "failed") {
      responseData = {
        id: generation.id,
        status: "failed",
        error: {
          message: generation.error_message || "Generation failed",
          code: generation.error_code || "UNKNOWN_ERROR",
        },
        created_at: generation.created_at,
        failed_at: generation.failed_at,
      } as FailedGenerationDto;
    } else {
      // Default to processing for unknown statuses
      responseData = {
        id: generation.id,
        status: "processing",
        progress: 0,
        message: "Initializing...",
        created_at: generation.created_at,
      } as ProcessingGenerationDto;
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching generation status:", error);

    const errorResponse: ErrorResponseDto = {
      error: "InternalServerError",
      message: error instanceof Error ? error.message : "Failed to fetch generation status",
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
