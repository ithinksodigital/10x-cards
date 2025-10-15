// src/lib/api-utils.ts
import type { APIContext } from "astro";
import type { z } from "zod";
import type { ErrorResponseDto } from "../types";
import { ApiError, UnauthorizedError, ValidationError } from "./errors";

/**
 * Get authenticated user ID from Supabase session
 * @throws {UnauthorizedError} If user is not authenticated
 */
export async function getAuthenticatedUserId(context: APIContext): Promise<string> {
  const {
    data: { user },
    error,
  } = await context.locals.supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError("Authentication required");
  }

  return user.id;
}

/**
 * Get user ID for MVP - uses hardcoded ID for testing
 * TODO: Remove this function and use getAuthenticatedUserId() in production
 * @returns Hardcoded user ID for MVP testing
 */
export function getMvpUserId(): string {
  // MVP: Hardcoded user ID for testing without authentication
  return "00000000-0000-0000-0000-000000000001";
}

/**
 * Parse and validate JSON request body
 * @throws {ValidationError} If JSON is invalid or validation fails
 */
export async function parseJsonBody<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON in request body");
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const details: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      details[path || "body"] = issue.message;
    });

    throw new ValidationError("Request validation failed", details);
  }

  return result.data;
}

/**
 * Validate query parameters
 * @throws {ValidationError} If validation fails
 */
export function validateQuery<T>(url: URL, schema: z.ZodSchema<T>): T {
  const params = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(params);

  if (!result.success) {
    const details: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      details[path] = issue.message;
    });

    throw new ValidationError("Query validation failed", details);
  }

  return result.data;
}

/**
 * Validate URL parameter (e.g., UUID)
 * @throws {ValidationError} If validation fails
 */
export function validateParam<T>(param: string | undefined, schema: z.ZodSchema<T>, paramName = "parameter"): T {
  const result = schema.safeParse(param);

  if (!result.success) {
    const details: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      details[paramName] = issue.message;
    });

    throw new ValidationError(`Invalid ${paramName}`, details);
  }

  return result.data;
}

/**
 * Create success JSON response
 */
export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create error JSON response
 */
export function errorResponse(error: unknown): Response {
  // eslint-disable-next-line no-console
  console.error("API Error:", error);
  // eslint-disable-next-line no-console
  console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
  // eslint-disable-next-line no-console
  console.error("Error details:", JSON.stringify(error, null, 2));

  if (error instanceof ApiError) {
    return new Response(JSON.stringify(error.toJSON()), {
      status: error.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Unknown error - don't leak internal details (but log them)
  const errorDto: ErrorResponseDto = {
    error: "InternalError",
    message: error instanceof Error ? error.message : "An unexpected error occurred",
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorDto), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Wrap endpoint handler with error handling
 * This ensures all errors are properly caught and formatted
 */
export function withErrorHandling(
  handler: (context: APIContext) => Promise<Response>
): (context: APIContext) => Promise<Response> {
  return async (context: APIContext) => {
    try {
      return await handler(context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
