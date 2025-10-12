// src/lib/errors.ts
import type { ErrorResponseDto } from '../types';

/**
 * Base API Error class
 * All custom API errors should extend this class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Convert error to JSON response format
   */
  toJSON(): ErrorResponseDto {
    return {
      error: this.error,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 400 Bad Request - Validation errors
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, string>) {
    super(400, 'ValidationError', message, 'VALIDATION_FAILED', details);
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'Unauthorized', message, 'UNAUTHORIZED');
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, 'NotFound', `${resource} not found`, 'NOT_FOUND');
  }
}

/**
 * 409 Conflict - Resource conflict (e.g., duplicate)
 */
export class ConflictError extends ApiError {
  constructor(message: string, code: string = 'CONFLICT') {
    super(409, 'Conflict', message, code);
  }
}

/**
 * 409 Conflict - Duplicate card error
 */
export class DuplicateCardError extends ConflictError {
  constructor(message: string = 'Card with this front text already exists in set') {
    super(message, 'DUPLICATE_CARD');
  }
}

/**
 * 422 Unprocessable Entity - Limit exceeded
 */
export class LimitExceededError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(422, 'LimitExceeded', message, 'LIMIT_EXCEEDED', details);
  }
}

/**
 * 422 Unprocessable Entity - Daily limit reached
 */
export class DailyLimitError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(422, 'DailyLimitReached', message, 'DAILY_LIMIT_REACHED', details);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends ApiError {
  constructor(message: string, retryAfter?: number) {
    super(429, 'RateLimitExceeded', message, 'RATE_LIMIT_EXCEEDED', { retry_after: retryAfter });
  }
}

/**
 * 500 Internal Server Error - Unexpected errors
 */
export class InternalError extends ApiError {
  constructor(message: string = 'An unexpected error occurred') {
    super(500, 'InternalError', message, 'INTERNAL_ERROR');
  }
}

