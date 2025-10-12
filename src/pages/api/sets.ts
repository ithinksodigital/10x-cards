// src/pages/api/sets.ts
import type { APIContext } from 'astro';
import { SetService } from '../../lib/services/set.service';
import { CreateSetSchema, ListSetsQuerySchema } from '../../lib/schemas';
import {
  getMvpUserId,
  parseJsonBody,
  validateQuery,
  jsonResponse,
  withErrorHandling,
} from '../../lib/api-utils';

export const prerender = false;

/**
 * GET /api/sets
 * List all sets for authenticated user with pagination and filtering
 *
 * Query Parameters:
 * - page (number, optional, default: 1)
 * - limit (number, optional, default: 50, max: 50)
 * - search (string, optional) - search in set names
 * - sort (enum, optional: created_at, updated_at, name, default: created_at)
 * - order (enum, optional: asc, desc, default: desc)
 *
 * Response: 200 OK
 * {
 *   "data": [SetDto[]],
 *   "pagination": PaginationDto
 * }
 */
export const GET = withErrorHandling(async (context: APIContext) => {
  // 1. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 2. Validate query parameters
  const query = validateQuery(context.url, ListSetsQuerySchema);

  // 3. Get sets via service
  const setService = new SetService(context.locals.supabase);
  const result = await setService.listSets(userId, query);

  // 4. Return response
  return jsonResponse(result, 200);
});

/**
 * POST /api/sets
 * Create a new flashcard set
 *
 * Request Body:
 * {
 *   "name": string (1-100 chars, required),
 *   "language": enum ("pl" | "en" | "es", required)
 * }
 *
 * Response: 201 Created
 * SetDto
 *
 * Errors:
 * - 400 Bad Request - Validation errors
 * - 401 Unauthorized - Missing/invalid token
 * - 409 Conflict - Set name already exists
 */
export const POST = withErrorHandling(async (context: APIContext) => {
  // 1. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 2. Parse and validate request body
  const command = await parseJsonBody(context.request, CreateSetSchema);

  // 3. Create set via service
  const setService = new SetService(context.locals.supabase);
  const newSet = await setService.createSet(command, userId);

  // 4. Return response with 201 Created status
  return jsonResponse(newSet, 201);
});

