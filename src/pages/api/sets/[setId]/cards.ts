// src/pages/api/sets/[setId]/cards.ts
import type { APIContext } from 'astro';
import { CardService } from '../../../../lib/services/card.service';
import { SetService } from '../../../../lib/services/set.service';
import { UuidSchema, CreateCardSchema, ListCardsQuerySchema } from '../../../../lib/schemas';
import {
  getMvpUserId,
  parseJsonBody,
  validateParam,
  validateQuery,
  jsonResponse,
  withErrorHandling,
} from '../../../../lib/api-utils';

export const prerender = false;

/**
 * GET /api/sets/:setId/cards
 * List all cards in a set with pagination and filtering
 *
 * URL Parameters:
 * - setId (uuid, required) - Set ID
 *
 * Query Parameters:
 * - page (number, optional, default: 1)
 * - limit (number, optional, default: 50, max: 50)
 * - search (string, optional) - search in front/back text
 * - status (enum, optional: new, learning, review, relearning)
 * - sort (enum, optional: created_at, due_at, default: created_at)
 * - order (enum, optional: asc, desc, default: desc)
 *
 * Response: 200 OK
 * {
 *   "data": [CardDto[]],
 *   "pagination": PaginationDto
 * }
 *
 * Errors:
 * - 400 Bad Request - Invalid parameters
 * - 401 Unauthorized - Missing/invalid token
 * - 404 Not Found - Set not found
 */
export const GET = withErrorHandling(async (context: APIContext) => {
  // 1. Validate UUID parameter
  const setId = validateParam(context.params.setId, UuidSchema, 'setId');

  // 2. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 3. Verify set exists and belongs to user
  const setService = new SetService(context.locals.supabase);
  await setService.verifySetOwnership(setId, userId);

  // 4. Validate query parameters
  const query = validateQuery(context.url, ListCardsQuerySchema);

  // 5. Get cards via service
  const cardService = new CardService(context.locals.supabase);
  const result = await cardService.listCards(setId, userId, query);

  // 6. Return response
  return jsonResponse(result, 200);
});

/**
 * POST /api/sets/:setId/cards
 * Create a new card manually in a set
 *
 * URL Parameters:
 * - setId (uuid, required) - Set ID
 *
 * Request Body:
 * {
 *   "front": string (1-200 chars, required),
 *   "back": string (1-500 chars, required)
 * }
 *
 * Response: 201 Created
 * CardDto
 *
 * Errors:
 * - 400 Bad Request - Validation errors
 * - 401 Unauthorized - Missing/invalid token
 * - 404 Not Found - Set not found
 * - 409 Conflict - Duplicate card (same front text)
 * - 422 Unprocessable Entity - Limit exceeded (200/set or 1000/user)
 */
export const POST = withErrorHandling(async (context: APIContext) => {
  // 1. Validate UUID parameter
  const setId = validateParam(context.params.setId, UuidSchema, 'setId');

  // 2. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 3. Parse and validate request body
  const command = await parseJsonBody(context.request, CreateCardSchema);

  // 4. Create card via service
  const cardService = new CardService(context.locals.supabase);
  const newCard = await cardService.createCard(setId, command, userId);

  // 5. Return response with 201 Created status
  return jsonResponse(newCard, 201);
});

