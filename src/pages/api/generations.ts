// src/pages/api/generations.ts
import type { APIContext } from "astro";
import { z } from "zod";
import { GenerationService } from "../../lib/services/generation.service";
import type { ErrorResponseDto, StartGenerationResponseDto } from "../../types";
import { isFeatureEnabled } from "../../features";

export const prerender = false;

// Zod schema for request validation
const StartGenerationSchema = z.object({
  source_text: z
    .string()
    .min(100, "Source text must be at least 100 characters")
    .max(15000, "Source text must not exceed 15,000 characters"),
  language: z
    .string()
    .regex(/^[a-z]{2}$/, "Language must be a valid ISO 639-1 code (e.g., pl, en, es)")
    .optional(),
  target_count: z
    .number()
    .int()
    .min(1, "Target count must be at least 1")
    .max(30, "Target count must not exceed 30")
    .optional()
    .default(30),
});

/**
 * POST /api/generations
 * Initiates asynchronous AI flashcard generation from source text.
 * Returns immediately with generation metadata (status "processing").
 *
 * Allows both authenticated and anonymous users to generate cards.
 * Anonymous users can generate but cannot save cards to sets.
 */
export async function POST(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase;

  // 0. Check if collections feature is enabled
  if (!isFeatureEnabled("collections")) {
    const errorResponse: ErrorResponseDto = {
      error: "Feature Unavailable",
      message: "Collections feature is currently disabled",
      timestamp: new Date().toISOString(),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Check if user is authenticated, otherwise use anonymous ID
  const user = context.locals.user;
  const userId = user ? user.id : "anonymous-user";

  // 2. Parse and validate request body
  let requestBody: unknown;
  try {
    requestBody = await context.request.json();
  } catch {
    const errorResponse: ErrorResponseDto = {
      error: "BadRequest",
      message: "Invalid JSON in request body",
      timestamp: new Date().toISOString(),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = StartGenerationSchema.safeParse(requestBody);

  if (!validationResult.success) {
    const details: Record<string, string> = {};
    validationResult.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      details[path] = issue.message;
    });

    const errorResponse: ErrorResponseDto = {
      error: "ValidationError",
      message: "Request validation failed",
      details,
      timestamp: new Date().toISOString(),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const command = validationResult.data;

  // 3. Call GenerationService to start generation
  try {
    const generationService = new GenerationService(supabase);
    const result: StartGenerationResponseDto = await generationService.startGeneration(command, userId);

    // 4. Return 202 Accepted with generation metadata
    return new Response(JSON.stringify(result), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("Error starting generation:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      // Rate limiting error
      if (error.message.includes("rate limit")) {
        const errorResponse: ErrorResponseDto = {
          error: "TooManyRequests",
          message: error.message,
          code: "RATE_LIMIT_EXCEEDED",
          timestamp: new Date().toISOString(),
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }

      // OpenRouter API key error
      if (error.message.includes("API key not configured")) {
        const errorResponse: ErrorResponseDto = {
          error: "ConfigurationError",
          message: "AI service not configured. Please contact support.",
          code: "API_KEY_MISSING",
          timestamp: new Date().toISOString(),
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Database or other internal errors
      const errorResponse: ErrorResponseDto = {
        error: "InternalError",
        message: error.message || "An unexpected error occurred while processing your request",
        code: "GENERATION_FAILED",
        timestamp: new Date().toISOString(),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Unknown error type
    // eslint-disable-next-line no-console
    console.error("Unknown error starting generation:", error);
    const errorResponse: ErrorResponseDto = {
      error: "InternalError",
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
