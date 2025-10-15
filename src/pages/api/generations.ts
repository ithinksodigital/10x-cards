// src/pages/api/generations.ts
import type { APIContext } from "astro";
import { z } from "zod";
import { GenerationService } from "../../lib/services/generation.service";
import type { ErrorResponseDto, StartGenerationResponseDto } from "../../types";

// Load environment variables from .env file
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from project root
dotenv.config({ path: join(__dirname, "../../../.env") });

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
    console.log("Starting generation with command:", {
      source_text_length: command.source_text.length,
      language: command.language,
      target_count: command.target_count,
      user_id: userId,
    });

    // Check environment variables
    console.log("Environment check:", {
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      openRouterKeyLength: process.env.OPENROUTER_API_KEY?.length || 0,
      allEnvKeys: Object.keys(process.env).filter((k) => k.includes("OPENROUTER")),
    });

    const generationService = new GenerationService(supabase);
    const result: StartGenerationResponseDto = await generationService.startGeneration(command, userId);

    console.log("Generation started successfully:", {
      generation_id: result.id,
      status: result.status,
      estimated_duration_ms: result.estimated_duration_ms,
    });

    // 4. Return 202 Accepted with generation metadata
    return new Response(JSON.stringify(result), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error) {
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
