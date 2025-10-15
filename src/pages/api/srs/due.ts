// src/pages/api/srs/due.ts
import type { APIContext } from "astro";
import { SrsService } from "../../../lib/services/srs.service";
import { CardService } from "../../../lib/services/card.service";
import { GetDueCardsQuerySchema } from "../../../lib/schemas";
import { getMvpUserId, validateQuery, jsonResponse, withErrorHandling } from "../../../lib/api-utils";

export const prerender = false;

/**
 * GET /api/srs/due
 * Get cards due for review today
 *
 * Query Parameters:
 * - set_id (uuid, optional) - Filter by specific set
 *
 * Response: 200 OK
 * {
 *   "new_cards_available": number,
 *   "review_cards_available": number,
 *   "daily_limits": {
 *     "new_cards": number,
 *     "reviews": number,
 *     "new_cards_remaining": number,
 *     "reviews_remaining": number
 *   },
 *   "cards": DueCardDto[]
 * }
 *
 * Errors:
 * - 400 Bad Request - Invalid query parameters
 * - 401 Unauthorized - Missing/invalid token
 */
export const GET = withErrorHandling(async (context: APIContext) => {
  // 1. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 2. Validate query parameters
  const query = validateQuery(context.url, GetDueCardsQuerySchema);

  // 3. Get due cards via service
  const cardService = new CardService(context.locals.supabase);
  const srsService = new SrsService(context.locals.supabase, cardService);
  const result = await srsService.getDueCards(userId, query.set_id);

  // 4. Return response
  return jsonResponse(result, 200);
});
