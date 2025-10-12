// src/hooks/useGenerationApi.ts
import { useState, useCallback } from 'react';
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

  const startPolling = useCallback(async () => {
    if (!generationId) return;

    setIsPolling(true);
    setPollingError(null);
    
    const startTime = Date.now();
    let backoffDelay = 1000; // Start with 1s delay

    const poll = async (): Promise<void> => {
      try {
        // Check timeout
        if (Date.now() - startTime > timeout) {
          throw new Error('Generation timeout. Please try again.');
        }

        const response = await fetch(`/api/generations/${generationId}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required. Please log in.');
          }
          
          if (response.status === 404) {
            throw new Error('Generation not found.');
          }
          
          if (response.status >= 500) {
            throw new Error('Server error while checking status.');
          }
          
          throw new Error(`Status check failed with status ${response.status}`);
        }

        const data: ProcessingGenerationDto | CompletedGenerationDto | FailedGenerationDto = await response.json();
        
        onUpdate(data);

        // Stop polling if generation is completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
          return;
        }

        // Continue polling with exponential backoff
        setTimeout(poll, backoffDelay);
        backoffDelay = Math.min(backoffDelay * 1.5, 5000); // Max 5s delay

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Polling error occurred';
        setPollingError(errorMessage);
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
    setIsPolling(false);
  }, []);

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
