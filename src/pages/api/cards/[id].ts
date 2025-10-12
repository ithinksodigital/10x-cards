// src/pages/api/cards/[id].ts
import type { APIContext } from 'astro';
import { CardService } from '../../../lib/services/card.service';
import { UuidSchema, UpdateCardSchema } from '../../../lib/schemas';
import {
  getMvpUserId,
  parseJsonBody,
  validateParam,
  jsonResponse,
  withErrorHandling,
} from '../../../lib/api-utils';

export const prerender = false;

/**
 * GET /api/cards/:id
 * Get a single card by ID with full details
 *
 * URL Parameters:
 * - id (uuid, required) - Card ID
 *
 * Response: 200 OK
 * CardDetailDto (includes original_front and original_back)
 *
 * Errors:
 * - 400 Bad Request - Invalid UUID
 * - 401 Unauthorized - Missing/invalid token
 * - 404 Not Found - Card not found or doesn't belong to user
 */
export const GET = withErrorHandling(async (context: APIContext) => {
  // 1. Validate UUID parameter
  const cardId = validateParam(context.params.id, UuidSchema, 'id');

  // 2. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 3. Get card via service
  const cardService = new CardService(context.locals.supabase);
  const card = await cardService.getCard(cardId, userId);

  // 4. Return response
  return jsonResponse(card, 200);
});

/**
 * PATCH /api/cards/:id
 * Update a card's content (front and/or back)
 *
 * URL Parameters:
 * - id (uuid, required) - Card ID
 *
 * Request Body:
 * {
 *   "front": string (1-200 chars, optional),
 *   "back": string (1-500 chars, optional)
 * }
 * Note: At least one field must be provided
 *
 * Response: 200 OK
 * UpdateCardResponseDto (includes was_edited_after_generation, original values)
 *
 * Errors:
 * - 400 Bad Request - Validation errors
 * - 401 Unauthorized - Missing/invalid token
 * - 404 Not Found - Card not found
 * - 409 Conflict - New front text conflicts with existing card
 */
export const PATCH = withErrorHandling(async (context: APIContext) => {
  // 1. Validate UUID parameter
  const cardId = validateParam(context.params.id, UuidSchema, 'id');

  // 2. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 3. Parse and validate body
  const command = await parseJsonBody(context.request, UpdateCardSchema);

  // 4. Update via service
  const cardService = new CardService(context.locals.supabase);
  const updatedCard = await cardService.updateCard(cardId, command, userId);

  // 5. Return response
  return jsonResponse(updatedCard, 200);
});

/**
 * DELETE /api/cards/:id
 * Delete a card
 *
 * URL Parameters:
 * - id (uuid, required) - Card ID
 *
 * Response: 200 OK
 * {
 *   "message": "Card successfully deleted"
 * }
 *
 * Errors:
 * - 400 Bad Request - Invalid UUID
 * - 401 Unauthorized - Missing/invalid token
 * - 404 Not Found - Card not found
 */
export const DELETE = withErrorHandling(async (context: APIContext) => {
  // 1. Validate UUID parameter
  const cardId = validateParam(context.params.id, UuidSchema, 'id');

  // 2. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 3. Delete via service
  const cardService = new CardService(context.locals.supabase);
  await cardService.deleteCard(cardId, userId);

  // 4. Return response
  return jsonResponse({
    message: 'Card successfully deleted',
  }, 200);
});

