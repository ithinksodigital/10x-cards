// src/pages/api/sets/[setId]/cards/batch.ts
import type { APIContext } from "astro";
import { CardService } from "../../../../../lib/services/card.service";
import { UuidSchema, BatchCreateCardsSchema } from "../../../../../lib/schemas";
import { parseJsonBody, validateParam, jsonResponse, withErrorHandling } from "../../../../../lib/api-utils";

export const prerender = false;

/**
 * POST /api/sets/:setId/cards/batch
 * Create multiple cards from AI generation
 *
 * URL Parameters:
 * - setId (uuid, required) - Set ID
 *
 * Request Body:
 * {
 *   "generation_id": uuid (required),
 *   "cards": [
 *     {
 *       "front": string (1-200 chars, required),
 *       "back": string (1-500 chars, required),
 *       "source_text_excerpt": string (optional, max 500 chars),
 *       "ai_confidence_score": number (optional, 0-1),
 *       "was_edited": boolean (required),
 *       "original_front": string | null (optional, max 200 chars),
 *       "original_back": string | null (optional, max 500 chars)
 *     }
 *   ] (min 1, max 30 cards)
 * }
 *
 * Response: 201 Created
 * {
 *   "created": number,
 *   "cards": CardDto[],
 *   "generation_updated": boolean
 * }
 *
 * Errors:
 * - 400 Bad Request - Validation errors
 * - 401 Unauthorized - Missing/invalid token
 * - 404 Not Found - Set or generation not found
 * - 422 Unprocessable Entity - Limit exceeded
 */
export const POST = withErrorHandling(async (context: APIContext) => {
  // 1. Check if user is authenticated
  const user = context.locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication required to save cards to sets",
        code: "AUTHENTICATION_REQUIRED",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. Validate UUID parameter
  const setId = validateParam(context.params.setId, UuidSchema, "setId");

  // 3. Use authenticated user ID
  const userId = user.id;

  // 4. Parse and validate request body
  const command = await parseJsonBody(context.request, BatchCreateCardsSchema);

  // 5. Batch create cards via service
  const cardService = new CardService(context.locals.supabase);
  const result = await cardService.batchCreateCards(setId, command, userId);

  // 6. Return response with 201 Created status
  return jsonResponse(result, 201);
});
