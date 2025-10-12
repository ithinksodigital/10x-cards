// src/pages/api/sets/[setId]/cards/batch.ts
import type { APIContext } from 'astro';
import { CardService } from '../../../../../lib/services/card.service';
import { UuidSchema, BatchCreateCardsSchema } from '../../../../../lib/schemas';
import {
  getMvpUserId,
  parseJsonBody,
  validateParam,
  jsonResponse,
  withErrorHandling,
} from '../../../../../lib/api-utils';

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
  // 1. Validate UUID parameter
  const setId = validateParam(context.params.setId, UuidSchema, 'setId');

  // 2. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 3. Parse and validate request body
  const command = await parseJsonBody(context.request, BatchCreateCardsSchema);

  // 4. Batch create cards via service
  const cardService = new CardService(context.locals.supabase);
  const result = await cardService.batchCreateCards(setId, command, userId);

  // 5. Return response with 201 Created status
  return jsonResponse(result, 201);
});

