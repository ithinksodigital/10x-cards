// src/lib/schemas.ts
import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID validation schema
 */
export const UuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Base pagination schema for query parameters
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(50),
});

// ============================================================================
// Sets Schemas
// ============================================================================

/**
 * Schema for creating a new set
 */
export const CreateSetSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  language: z.enum(['pl', 'en', 'es'], {
    errorMap: () => ({ message: 'Language must be one of: pl, en, es' })
  }),
});

/**
 * Schema for updating a set
 */
export const UpdateSetSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
});

/**
 * Schema for listing sets with filters
 */
export const ListSetsQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  sort: z.enum(['created_at', 'updated_at', 'name']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// Cards Schemas
// ============================================================================

/**
 * Schema for creating a single card manually
 */
export const CreateCardSchema = z.object({
  front: z.string()
    .min(1, 'Front text is required')
    .max(200, 'Front text must not exceed 200 characters'),
  back: z.string()
    .min(1, 'Back text is required')
    .max(500, 'Back text must not exceed 500 characters'),
});

/**
 * Schema for updating a card
 */
export const UpdateCardSchema = z.object({
  front: z.string()
    .min(1, 'Front text is required')
    .max(200, 'Front text must not exceed 200 characters')
    .optional(),
  back: z.string()
    .min(1, 'Back text is required')
    .max(500, 'Back text must not exceed 500 characters')
    .optional(),
}).refine(data => data.front !== undefined || data.back !== undefined, {
  message: 'At least one field (front or back) must be provided',
});

/**
 * Schema for a single card in batch creation
 */
export const BatchCreateCardItemSchema = z.object({
  front: z.string()
    .min(1, 'Front text is required')
    .max(200, 'Front text must not exceed 200 characters'),
  back: z.string()
    .min(1, 'Back text is required')
    .max(500, 'Back text must not exceed 500 characters'),
  source_text_excerpt: z.string()
    .max(500, 'Source text excerpt must not exceed 500 characters')
    .optional(),
  ai_confidence_score: z.number()
    .min(0, 'Confidence score must be between 0 and 1')
    .max(1, 'Confidence score must be between 0 and 1')
    .optional(),
  was_edited: z.boolean(),
  original_front: z.string()
    .max(200, 'Original front must not exceed 200 characters')
    .nullable()
    .optional(),
  original_back: z.string()
    .max(500, 'Original back must not exceed 500 characters')
    .nullable()
    .optional(),
});

/**
 * Schema for batch card creation
 */
export const BatchCreateCardsSchema = z.object({
  generation_id: UuidSchema,
  cards: z.array(BatchCreateCardItemSchema)
    .min(1, 'At least one card is required')
    .max(30, 'Maximum 30 cards can be created at once'),
});

/**
 * Schema for listing cards in a set
 */
export const ListCardsQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  status: z.enum(['new', 'learning', 'review', 'relearning']).optional(),
  sort: z.enum(['created_at', 'due_at']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// SRS (Spaced Repetition System) Schemas
// ============================================================================

/**
 * Schema for getting due cards
 */
export const GetDueCardsQuerySchema = z.object({
  set_id: UuidSchema.optional(),
});

/**
 * Schema for starting an SRS session
 */
export const StartSessionSchema = z.object({
  set_id: UuidSchema,
  new_cards_limit: z.number()
    .int()
    .min(0, 'New cards limit must be at least 0')
    .max(20, 'New cards limit must not exceed 20')
    .optional()
    .default(20),
  review_cards_limit: z.number()
    .int()
    .min(0, 'Review cards limit must be at least 0')
    .max(100, 'Review cards limit must not exceed 100')
    .optional()
    .default(100),
});

/**
 * Schema for submitting a card review
 */
export const SubmitReviewSchema = z.object({
  card_id: UuidSchema,
  rating: z.number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be between 1 and 5'),
  session_id: UuidSchema,
});

// ============================================================================
// Generations Schemas
// ============================================================================

/**
 * Schema for starting a new generation
 */
export const StartGenerationSchema = z.object({
  source_text: z.string()
    .min(100, 'Source text must be at least 100 characters')
    .max(15000, 'Source text must not exceed 15,000 characters'),
  language: z.enum(['pl', 'en', 'es']).optional(),
  target_count: z.number()
    .int()
    .min(1, 'Target count must be at least 1')
    .max(30, 'Target count must not exceed 30')
    .optional()
    .default(30),
});

