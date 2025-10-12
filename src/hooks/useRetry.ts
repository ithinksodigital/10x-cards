// src/hooks/useRetry.ts
import { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: () => void;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  lastError: Error | null;
  canRetry: boolean;
}

export function useRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    lastError: null,
    canRetry: true,
  });

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
    return Math.min(delay, maxDelay);
  }, [initialDelay, backoffFactor, maxDelay]);

  const executeWithRetry = useCallback(async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    let currentAttempt = 0;
    let lastError: Error | null = null;

    while (currentAttempt <= maxRetries) {
      try {
        setState(prev => ({
          ...prev,
          isRetrying: currentAttempt > 0,
          attempt: currentAttempt,
          lastError: null,
        }));

        if (currentAttempt > 0 && onRetry) {
          onRetry(currentAttempt);
        }

        const result = await fn(...args);
        
        setState(prev => ({
          ...prev,
          isRetrying: false,
          attempt: 0,
          lastError: null,
          canRetry: true,
        }));

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        currentAttempt++;

        if (currentAttempt > maxRetries) {
          setState(prev => ({
            ...prev,
            isRetrying: false,
            attempt: currentAttempt - 1,
            lastError,
            canRetry: false,
          }));

          if (onMaxRetriesReached) {
            onMaxRetriesReached();
          }

          throw lastError;
        }

        // Wait before retrying
        const delay = calculateDelay(currentAttempt);
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, delay);
        });
      }
    }

    throw lastError;
  }, [fn, maxRetries, calculateDelay, onRetry, onMaxRetriesReached]);

  const retry = useCallback(async (...args: Parameters<T>) => {
    return executeWithRetry(...args);
  }, [executeWithRetry]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setState({
      isRetrying: false,
      attempt: 0,
      lastError: null,
      canRetry: true,
    });
  }, []);

  return {
    ...state,
    retry,
    reset,
  };
}

/**
 * Hook for network retry with exponential backoff
 */
export function useNetworkRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
) {
  const retryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    ...options,
  };

  return useRetry(fn, retryOptions);
}

/**
 * Hook for API retry with specific error handling
 */
export function useApiRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
) {
  const retryOptions = {
    maxRetries: 2,
    initialDelay: 2000,
    maxDelay: 8000,
    backoffFactor: 2,
    ...options,
  };

  const shouldRetry = useCallback((error: Error): boolean => {
    // Retry on network errors, timeouts, and 5xx errors
    if (error.message.includes('NetworkError') || 
        error.message.includes('timeout') ||
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504')) {
      return true;
    }
    
    // Don't retry on client errors (4xx except 429)
    if (error.message.includes('400') ||
        error.message.includes('401') ||
        error.message.includes('403') ||
        error.message.includes('404')) {
      return false;
    }
    
    // Retry on rate limiting (429)
    if (error.message.includes('429')) {
      return true;
    }
    
    return false;
  }, []);

  const wrappedFn = useCallback(async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error && !shouldRetry(error)) {
        throw error;
      }
      throw error;
    }
  }, [fn, shouldRetry]);

  return useRetry(wrappedFn, retryOptions);
}
