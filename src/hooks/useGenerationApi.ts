// src/hooks/useGenerationApi.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { useApiRetry } from './useRetry';
import type { 
  StartGenerationCommand, 
  StartGenerationResponseDto,
  ProcessingGenerationDto,
  CompletedGenerationDto,
  FailedGenerationDto 
} from '@/types';
import type { FlashCardProposal } from '@/lib/view-models';

interface UseGenerationApiReturn {
  isGenerating: boolean;
  error: string | null;
  startGeneration: (command: StartGenerationCommand) => Promise<StartGenerationResponseDto>;
  retryGeneration: (generationId: string) => Promise<void>;
}

export function useGenerationApi(): UseGenerationApiReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { retry: retryStartGeneration, isRetrying, attempt, lastError } = useApiRetry(
    async (command: StartGenerationCommand): Promise<StartGenerationResponseDto> => {
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        if (response.status === 400) {
          const message = errorData.message || 'Invalid request. Please check your input.';
          throw new Error(message);
        }
        
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      return await response.json();
    },
    {
      maxRetries: 2,
      onRetry: (attempt) => {
        console.log(`Retrying generation start (attempt ${attempt})`);
      },
    }
  );

  const startGeneration = useCallback(async (command: StartGenerationCommand): Promise<StartGenerationResponseDto> => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await retryStartGeneration(command);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [retryStartGeneration]);

  const retryGeneration = useCallback(async (generationId: string): Promise<void> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/generations/${generationId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(errorData.message || `Retry failed with status ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    error,
    startGeneration,
    retryGeneration,
  };
}

/**
 * Hook for polling generation status
 */
export function useProgressPolling(
  generationId: string | null,
  onUpdate: (data: ProcessingGenerationDto | CompletedGenerationDto | FailedGenerationDto) => void,
  options: {
    interval?: number;
    timeout?: number;
    onError?: (error: string) => void;
  } = {}
) {
  const { interval = 2000, timeout = 60000, onError } = options;
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState<string | null>(null);
  
  // Use refs to track polling state and cleanup
  const pollingRef = useRef<{
    isActive: boolean;
    timeoutId: NodeJS.Timeout | null;
    consecutiveErrors: number;
    lastRequestTime: number;
    currentRequest: Promise<Response> | null;
  }>({
    isActive: false,
    timeoutId: null,
    consecutiveErrors: 0,
    lastRequestTime: 0,
    currentRequest: null,
  });

  const startPolling = useCallback(async () => {
    if (!generationId) return;

    // Clean up any existing polling
    if (pollingRef.current.timeoutId) {
      clearTimeout(pollingRef.current.timeoutId);
    }

    setIsPolling(true);
    setPollingError(null);
    pollingRef.current.isActive = true;
    pollingRef.current.consecutiveErrors = 0;
    pollingRef.current.lastRequestTime = 0;
    
    const startTime = Date.now();
    let backoffDelay = 1000; // Start with 1s delay

    const poll = async (): Promise<void> => {
      // Check if polling was stopped
      if (!pollingRef.current.isActive) {
        return;
      }

      try {
        // Check timeout
        if (Date.now() - startTime > timeout) {
          throw new Error('Generation timeout. Please try again.');
        }

        // Throttle requests to prevent resource exhaustion
        const now = Date.now();
        const timeSinceLastRequest = now - pollingRef.current.lastRequestTime;
        const minInterval = 500; // Minimum 500ms between requests
        
        if (timeSinceLastRequest < minInterval) {
          const delay = minInterval - timeSinceLastRequest;
          pollingRef.current.timeoutId = setTimeout(poll, delay);
          return;
        }

        pollingRef.current.lastRequestTime = now;

        // Prevent duplicate requests
        if (pollingRef.current.currentRequest) {
          console.warn(`Request already in progress for generation ${generationId}, skipping...`);
          pollingRef.current.timeoutId = setTimeout(poll, backoffDelay);
          return;
        }

        const requestPromise = fetch(`/api/generations/${generationId}`, {
          signal: AbortSignal.timeout(10000), // 10s timeout per request
        });
        
        pollingRef.current.currentRequest = requestPromise;
        const response = await requestPromise;
        pollingRef.current.currentRequest = null;
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required. Please log in.');
          }
          
          if (response.status === 404) {
            // For 404 errors, continue polling for a bit longer as the generation might still be processing
            console.warn(`Generation ${generationId} not found yet, continuing to poll...`);
            pollingRef.current.timeoutId = setTimeout(poll, backoffDelay);
            backoffDelay = Math.min(backoffDelay * 1.2, 3000); // Slower backoff for 404s
            return;
          }
          
          if (response.status >= 500) {
            throw new Error('Server error while checking status.');
          }
          
          throw new Error(`Status check failed with status ${response.status}`);
        }

        const data: ProcessingGenerationDto | CompletedGenerationDto | FailedGenerationDto = await response.json();
        
        // Reset error counter on successful request
        pollingRef.current.consecutiveErrors = 0;
        onUpdate(data);

        // Stop polling if generation is completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          pollingRef.current.isActive = false;
          setIsPolling(false);
          return;
        }

        // Continue polling with exponential backoff
        pollingRef.current.timeoutId = setTimeout(poll, backoffDelay);
        backoffDelay = Math.min(backoffDelay * 1.5, 5000); // Max 5s delay

      } catch (err) {
        // Clear current request on error
        pollingRef.current.currentRequest = null;
        pollingRef.current.consecutiveErrors++;
        
        // Circuit breaker: stop polling after too many consecutive errors
        if (pollingRef.current.consecutiveErrors >= 10) {
          console.error(`Too many consecutive errors (${pollingRef.current.consecutiveErrors}) for generation ${generationId}, stopping polling`);
          pollingRef.current.isActive = false;
          setIsPolling(false);
          setPollingError('Too many connection errors. Please refresh the page and try again.');
          if (onError) {
            onError('Too many connection errors. Please refresh the page and try again.');
          }
          return;
        }

        // Handle network errors more gracefully
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          console.warn(`Network error while polling generation ${generationId} (attempt ${pollingRef.current.consecutiveErrors}), retrying...`);
          // For network errors, retry with exponential backoff
          pollingRef.current.timeoutId = setTimeout(poll, backoffDelay);
          backoffDelay = Math.min(backoffDelay * 1.5, 5000);
          return;
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Polling error occurred';
        setPollingError(errorMessage);
        pollingRef.current.isActive = false;
        setIsPolling(false);
        
        if (onError) {
          onError(errorMessage);
        }
      }
    };

    // Start polling
    poll();
  }, [generationId, onUpdate, interval, timeout, onError]);

  const stopPolling = useCallback(() => {
    pollingRef.current.isActive = false;
    if (pollingRef.current.timeoutId) {
      clearTimeout(pollingRef.current.timeoutId);
      pollingRef.current.timeoutId = null;
    }
    // Clear any pending request
    pollingRef.current.currentRequest = null;
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isPolling,
    pollingError,
    startPolling,
    stopPolling,
  };
}

/**
 * Convert completed generation DTO to FlashCardProposal array
 */
export function convertToFlashCardProposals(
  completedDto: CompletedGenerationDto
): FlashCardProposal[] {
  return completedDto.cards.map((card, index) => ({
    id: `${completedDto.id}-${index}`, // Generate local ID
    front: card.front,
    back: card.back,
    source_text_excerpt: card.source_text_excerpt,
    ai_confidence_score: card.ai_confidence_score,
    was_edited: false,
    original_front: card.front,
    original_back: card.back,
    normalized_front: card.front.toLowerCase().trim(),
  }));
}
