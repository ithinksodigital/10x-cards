// src/pages/api/srs/sessions.ts
import type { APIContext } from "astro";
import { SrsService } from "../../../lib/services/srs.service";
import { CardService } from "../../../lib/services/card.service";
import { StartSessionSchema } from "../../../lib/schemas";
import { parseJsonBody, jsonResponse, withErrorHandling } from "../../../lib/api-utils";

export const prerender = false;

/**
 * POST /api/srs/sessions
 * Start a new SRS learning session
 *
 * Request Body:
 * {
 *   "set_id": uuid (required),
 *   "new_cards_limit": number (optional, default: 20, max: 20),
 *   "review_cards_limit": number (optional, default: 100, max: 100)
 * }
 *
 * Response: 201 Created
 * {
 *   "session_id": string,
 *   "cards": Array<{ id, front, back, status }>,
 *   "total_cards": number,
 *   "new_cards": number,
 *   "review_cards": number
 * }
 *
 * Errors:
 * - 400 Bad Request - Validation errors
 * - 401 Unauthorized - Missing/invalid token
 * - 404 Not Found - Set not found
 * - 422 Unprocessable Entity - Daily limit reached
 */
export const POST = withErrorHandling(async (context: APIContext) => {
  // 1. Check if user is authenticated
  const user = context.locals.user;
  if (!user) {
    return jsonResponse(
      {
        error: "Unauthorized",
        message: "Authentication required to start study sessions",
        code: "AUTHENTICATION_REQUIRED",
        timestamp: new Date().toISOString(),
      },
      401
    );
  }

  // 2. Use authenticated user ID
  const userId = user.id;

  // 3. Parse and validate request body
  const command = await parseJsonBody(context.request, StartSessionSchema);

  // 4. Start session via service
  const cardService = new CardService(context.locals.supabase);
  const srsService = new SrsService(context.locals.supabase, cardService);
  const result = await srsService.startSession(
    {
      set_id: command.set_id,
      new_cards_limit: command.new_cards_limit ?? 20,
      review_cards_limit: command.review_cards_limit ?? 100,
    },
    userId
  );

  // 5. Return response with 201 Created status
  return jsonResponse(result, 201);
});
