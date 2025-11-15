// src/hooks/useStudyApi.ts
import { useState, useCallback } from "react";
import type {
  StartSessionCommand,
  StartSessionResponseDto,
  SubmitReviewCommand,
  SubmitReviewResponseDto,
  SessionSummaryDto,
} from "@/types";

interface UseStudyApiReturn {
  isLoading: boolean;
  error: string | null;
  startSession: (command: StartSessionCommand) => Promise<StartSessionResponseDto>;
  submitReview: (command: SubmitReviewCommand) => Promise<SubmitReviewResponseDto>;
  getSessionSummary: (sessionId: string) => Promise<SessionSummaryDto>;
}

export function useStudyApi(): UseStudyApiReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (command: StartSessionCommand): Promise<StartSessionResponseDto> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/srs/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.");
        }

        if (response.status === 400) {
          const message = errorData.message || "Invalid request. Please check your input.";
          throw new Error(message);
        }

        if (response.status === 404) {
          throw new Error("Set not found.");
        }

        if (response.status === 422) {
          const message = errorData.message || "Daily limit reached. Please try again tomorrow.";
          throw new Error(message);
        }

        if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }

        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data: StartSessionResponseDto = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitReview = useCallback(async (command: SubmitReviewCommand): Promise<SubmitReviewResponseDto> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/srs/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.");
        }

        if (response.status === 400) {
          const message = errorData.message || "Invalid request. Please check your input.";
          throw new Error(message);
        }

        if (response.status === 404) {
          throw new Error("Card or session not found.");
        }

        if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }

        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data: SubmitReviewResponseDto = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSessionSummary = useCallback(async (sessionId: string): Promise<SessionSummaryDto> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/srs/sessions/${sessionId}/summary`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.");
        }

        if (response.status === 404) {
          throw new Error("Session not found.");
        }

        if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }

        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data: SessionSummaryDto = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    startSession,
    submitReview,
    getSessionSummary,
  };
}
