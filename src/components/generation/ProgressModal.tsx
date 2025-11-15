// src/components/generation/ProgressModal.tsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProgressPolling, convertToFlashCardProposals } from "@/hooks/useGenerationApi";
import type { ProcessingGenerationDto, CompletedGenerationDto, FailedGenerationDto } from "@/types";
import type { FlashCardProposal } from "@/lib/view-models";

interface ProgressModalProps {
  isOpen: boolean;
  generationId: string | null;
  onComplete: (proposals: FlashCardProposal[]) => void;
  onFailed: (error: string) => void;
  onRetry: () => void;
  onCancel: () => void;
  className?: string;
}

export function ProgressModal({ isOpen, generationId, onComplete, onFailed, onRetry, onCancel }: ProgressModalProps) {
  const [currentStatus, setCurrentStatus] = useState<
    ProcessingGenerationDto | CompletedGenerationDto | FailedGenerationDto | null
  >(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const isCancelledRef = React.useRef(false);
  const isOpenRef = React.useRef(isOpen);

  // Keep refs in sync with state
  React.useEffect(() => {
    isCancelledRef.current = isCancelled;
  }, [isCancelled]);

  React.useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const { isPolling, pollingError, startPolling, stopPolling } = useProgressPolling(
    generationId,
    (data) => {
      // Use refs to get latest values (avoid stale closure)
      if (isCancelledRef.current || !isOpenRef.current) {
        return;
      }

      setCurrentStatus(data);

      if (data.status === "completed") {
        // Double check with refs before calling onComplete
        if (!isCancelledRef.current && isOpenRef.current) {
          const proposals = convertToFlashCardProposals(data as CompletedGenerationDto);
          onComplete(proposals);
        }
      } else if (data.status === "failed") {
        // Double check with refs before calling onFailed
        if (!isCancelledRef.current && isOpenRef.current) {
          const failedData = data as FailedGenerationDto;
          onFailed(failedData.error.message);
        }
      }
    },
    {
      interval: 15000, // 15 seconds base interval - AI needs time
      timeout: 180000, // 3 minutes timeout (AI generation can take longer)
      onError: (error) => {
        onFailed(error);
      },
    }
  );

  // Reset cancelled flag when modal opens with new generation
  useEffect(() => {
    if (isOpen && generationId && generationId !== "pending") {
      setIsCancelled(false);
    }
  }, [isOpen, generationId]);

  // Start polling when modal opens and we have a valid generation ID
  useEffect(() => {
    // Only start polling if modal is open AND we have a valid generation ID (not "pending") AND not cancelled
    if (isOpen && generationId && generationId !== "pending" && !isCancelled) {
      startPolling();
    } else {
      stopPolling();
      if (!isOpen) {
        setCurrentStatus(null);
        setIsCancelled(false);
      }
    }

    // Cleanup on unmount or when modal closes
    return () => {
      if (!isOpen) {
        stopPolling();
      }
    };
  }, [isOpen, generationId, isCancelled, startPolling, stopPolling]);

  const getStatusMessage = () => {
    // Show initializing message if we're waiting for generation ID
    if (generationId === "pending" || (!currentStatus && generationId)) {
      return "Starting generation...";
    }

    if (!currentStatus) {
      return "Initializing generation...";
    }

    switch (currentStatus.status) {
      case "processing": {
        const processingData = currentStatus as ProcessingGenerationDto;
        return processingData.message || "Processing your text...";
      }
      case "completed":
        return "Generation completed successfully!";
      case "failed":
        return "Generation failed. Please try again.";
      default:
        return "Processing...";
    }
  };

  const isCompleted = currentStatus?.status === "completed";
  const isFailed = currentStatus?.status === "failed" || pollingError;

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Prevent closing modal during generation
        if (!open && (isPolling || (!isCompleted && !isFailed))) {
          return;
        }
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent
        className={cn(
          "!fixed !inset-0 !z-[100] !w-full !h-full !max-w-none !max-h-none !rounded-none !border-0 !p-0 !m-0",
          "!bg-background/95 backdrop-blur-xl",
          "!flex !items-center !justify-center",
          "!translate-x-0 !translate-y-0 !top-0 !left-0",
          "[&>div[data-slot='dialog-overlay']]:!z-[99] [&>div[data-slot='dialog-overlay']]:!bg-black/60 [&>div[data-slot='dialog-overlay']]:backdrop-blur-md"
        )}
        showCloseButton={false}
        onInteractOutside={(e) => {
          // Prevent closing modal during generation
          if (isPolling || (!isCompleted && !isFailed)) {
            e.preventDefault();
          }
        }}
      >
        <div className="w-full max-w-2xl mx-auto px-6 py-12">
          <div className="text-center space-y-8">
            {/* Animated Icon */}
            <div className="flex justify-center">
              {isCompleted ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                  <div className="relative w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ) : isFailed ? (
                <div className="relative">
                  <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Pulsing background circle */}
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                  {/* Rotating spinner */}
                  <div className="relative w-24 h-24">
                    <svg
                      className="w-24 h-24 text-primary animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <h2 id="progress-modal-title" className="text-3xl font-bold text-foreground mb-2">
                {isCompleted ? "Generation Complete!" : isFailed ? "Generation Failed" : "Generating Flashcards"}
              </h2>
              <p className="text-lg text-muted-foreground">{getStatusMessage()}</p>
            </div>

            {/* Animated dots */}
            {!isCompleted && !isFailed && (
              <div className="flex justify-center gap-2">
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                  aria-hidden="true"
                />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                  aria-hidden="true"
                />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                  aria-hidden="true"
                />
              </div>
            )}

            {/* Error details */}
            {isFailed && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {pollingError ||
                    (currentStatus as FailedGenerationDto)?.error?.message ||
                    "An unexpected error occurred"}
                </p>
              </div>
            )}

            {/* Success message */}
            {isCompleted && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your flashcards have been generated successfully! You can now review and edit them.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-center pt-4">
              {isFailed ? (
                <>
                  <Button onClick={onRetry} className="px-6" size="lg">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Try Again
                  </Button>
                  <Button onClick={onCancel} variant="outline" className="px-6" size="lg">
                    Cancel
                  </Button>
                </>
              ) : isCompleted ? (
                <Button onClick={onCancel} className="px-8" size="lg">
                  Continue
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing progress modal state
 */
export function useProgressModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);

  const openModal = (id: string) => {
    setGenerationId(id);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setGenerationId(null);
  };

  return {
    isOpen,
    generationId,
    openModal,
    closeModal,
  };
}
