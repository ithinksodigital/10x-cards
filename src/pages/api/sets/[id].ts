// src/pages/api/sets/[id].ts
import type { APIContext } from 'astro';
import { SetService } from '../../../lib/services/set.service';
import { UuidSchema, UpdateSetSchema } from '../../../lib/schemas';
import {
  getMvpUserId,
  parseJsonBody,
  validateParam,
  jsonResponse,
  withErrorHandling,
} from '../../../lib/api-utils';

export const prerender = false;

/**
 * GET /api/sets/:id
 * Get a single set by ID
 *
 * URL Parameters:
 * - id (uuid, required) - Set ID
 *
 * Response: 200 OK
 * SetDto
 *
 * Errors:
 * - 400 Bad Request - Invalid UUID
 * - 401 Unauthorized - Missing/invalid token
 * - 404 Not Found - Set not found or doesn't belong to user
 */
export const GET = withErrorHandling(async (context: APIContext) => {
  // 1. Validate UUID parameter
  const setId = validateParam(context.params.id, UuidSchema, 'id');

  // 2. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 3. Get set via service
  const setService = new SetService(context.locals.supabase);
  const set = await setService.getSet(setId, userId);

  // 4. Return response
  return jsonResponse(set, 200);
});

/**
 * PATCH /api/sets/:id
 * Update a set's name
 *
 * URL Parameters:
 * - id (uuid, required) - Set ID
 *
 * Request Body:
 * {
 *   "name": string (1-100 chars, required)
 * }
 *
 * Response: 200 OK
 * SetDto
 *
 * Errors:
 * - 400 Bad Request - Validation errors
 * - 401 Unauthorized - Missing/invalid token
 * - 404 Not Found - Set not found
 * - 409 Conflict - New name conflicts with existing set
 */
export const PATCH = withErrorHandling(async (context: APIContext) => {
  // 1. Validate UUID parameter
  const setId = validateParam(context.params.id, UuidSchema, 'id');

  // 2. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 3. Parse and validate body
  const command = await parseJsonBody(context.request, UpdateSetSchema);

  // 4. Update via service
  const setService = new SetService(context.locals.supabase);
  const updatedSet = await setService.updateSet(setId, command, userId);

  // 5. Return response
  return jsonResponse(updatedSet, 200);
});

/**
 * DELETE /api/sets/:id
 * Delete a set and all its cards (CASCADE)
 *
 * URL Parameters:
 * - id (uuid, required) - Set ID
 *
 * Response: 200 OK
 * {
 *   "message": "Set and X cards successfully deleted"
 * }
 *
 * Errors:
 * - 400 Bad Request - Invalid UUID
 * - 401 Unauthorized - Missing/invalid token
 * - 404 Not Found - Set not found
 */
export const DELETE = withErrorHandling(async (context: APIContext) => {
  // 1. Validate UUID parameter
  const setId = validateParam(context.params.id, UuidSchema, 'id');

  // 2. MVP: Get hardcoded user ID
  const userId = getMvpUserId();

  // 3. Delete via service
  const setService = new SetService(context.locals.supabase);
  const result = await setService.deleteSet(setId, userId);

  // 4. Return response
  return jsonResponse({
    message: `Set and ${result.cardsCount} cards successfully deleted`,
  }, 200);
});

