// src/pages/api/srs/sessions/[id]/summary.ts
import type { APIContext } from "astro";
import { SrsService } from "../../../../../lib/services/srs.service";
import { CardService } from "../../../../../lib/services/card.service";
import { UuidSchema } from "../../../../../lib/schemas";
import { validateParam, jsonResponse, withErrorHandling } from "../../../../../lib/api-utils";

export const prerender = false;

/**
 * GET /api/srs/sessions/:id/summary
 * Get session summary with statistics (active or completed session)
 *
 * URL Parameters:
 * - id (uuid, required) - Session ID
 *
 * Response: 200 OK
 * {
 *   "session_id": string,
 *   "started_at": string (ISO date),
 *   "completed_at": string (ISO date),
 *   "total_cards": number,
 *   "cards_reviewed": number,
 *   "average_rating": number,
 *   "ratings_distribution": Record<string, number>,
 *   "time_spent_seconds": number
 * }
 *
 * Errors:
 * - 400 Bad Request - Invalid UUID
 * - 401 Unauthorized - Missing/invalid token or session doesn't belong to user
 * - 404 Not Found - Session not found
 */
export const GET = withErrorHandling(async (context: APIContext) => {
  // 1. Check if user is authenticated
  const user = context.locals.user;
  if (!user) {
    return jsonResponse(
      {
        error: "Unauthorized",
        message: "Authentication required to view session summary",
        code: "AUTHENTICATION_REQUIRED",
        timestamp: new Date().toISOString(),
      },
      401
    );
  }

  // 2. Validate UUID parameter
  const sessionId = validateParam(context.params.id, UuidSchema, "id");

  // 3. Use authenticated user ID
  const userId = user.id;

  // 4. Get session summary via service
  const cardService = new CardService(context.locals.supabase);
  const srsService = new SrsService(context.locals.supabase, cardService);
  const result = await srsService.getSessionSummary(sessionId, userId);

  // 5. Return response
  return jsonResponse(result, 200);
});
