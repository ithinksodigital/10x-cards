// src/pages/api/srs/reviews.ts
import type { APIContext } from "astro";
import { SrsService } from "../../../lib/services/srs.service";
import { CardService } from "../../../lib/services/card.service";
import { SubmitReviewSchema } from "../../../lib/schemas";
import { getMvpUserId, parseJsonBody, jsonResponse, withErrorHandling } from "../../../lib/api-utils";

export const prerender = false;

/**
 * POST /api/srs/reviews
 * Submit a card review with rating (implements SM-2 algorithm)
 *
 * Request Body:
 * {
 *   "card_id": uuid (required),
 *   "rating": number (required, 1-5),
 *   "session_id": uuid (required)
 * }
 *
 * Rating scale:
 * - 1: Again (complete blackout)
 * - 2: Hard (incorrect response, but upon seeing correct answer it felt familiar)
 * - 3: Good (correct response, but with difficulty)
 * - 4: Easy (correct response with perfect recall)
 * - 5: Perfect (immediate perfect recall)
 *
 * Response: 201 Created
 * {
 *   "card_id": string,
 *   "next_review_at": string (ISO date),
 *   "interval_days": number,
 *   "ease_factor": number,
 *   "repetitions": number,
 *   "status": card_status
 * }
 *
 * Errors:
 * - 400 Bad Request - Invalid rating or parameters
 * - 401 Unauthorized - Missing/invalid token or session doesn't belong to user
 * - 404 Not Found - Card or session not found
 */
export const POST = withErrorHandling(async (context: APIContext) => {
  // 1. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 2. Parse and validate request body
  const command = await parseJsonBody(context.request, SubmitReviewSchema);

  // 3. Submit review via service (SM-2 algorithm)
  const cardService = new CardService(context.locals.supabase);
  const srsService = new SrsService(context.locals.supabase, cardService);
  const result = await srsService.submitReview(command, userId);

  // 4. Return response with 201 Created status
  return jsonResponse(result, 201);
});
