// src/hooks/useSetsApi.ts
import { useState, useCallback } from 'react';
import type { SetDto, CreateSetCommand, BatchCreateCardsCommand, BatchCreateCardsResponseDto } from '@/types';

interface UseSetsApiReturn {
  isLoading: boolean;
  error: string | null;
  sets: SetDto[];
  fetchSets: () => Promise<SetDto[]>;
  createSet: (command: CreateSetCommand) => Promise<SetDto>;
  batchCreateCards: (setId: string, command: BatchCreateCardsCommand) => Promise<BatchCreateCardsResponseDto>;
}

export function useSetsApi(): UseSetsApiReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sets, setSets] = useState<SetDto[]>([]);

  const fetchSets = useCallback(async (): Promise<SetDto[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setSets(data.data || []);
      return data.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSet = useCallback(async (command: CreateSetCommand): Promise<SetDto> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sets', {
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
        
        if (response.status === 400) {
          const message = errorData.message || 'Invalid request. Please check your input.';
          throw new Error(message);
        }
        
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data: SetDto = await response.json();
      setSets(prev => [...prev, data]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const batchCreateCards = useCallback(async (setId: string, command: BatchCreateCardsCommand): Promise<BatchCreateCardsResponseDto> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sets/${setId}/cards/batch`, {
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
        
        if (response.status === 400) {
          const message = errorData.message || 'Invalid request. Please check your input.';
          throw new Error(message);
        }
        
        if (response.status === 409) {
          const message = errorData.message || 'Some cards already exist or conflict occurred.';
          throw new Error(message);
        }
        
        if (response.status === 422) {
          const message = errorData.message || 'Validation failed. Please check your input.';
          throw new Error(message);
        }
        
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data: BatchCreateCardsResponseDto = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    sets,
    fetchSets,
    createSet,
    batchCreateCards,
  };
}
