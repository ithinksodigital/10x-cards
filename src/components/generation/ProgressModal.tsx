// src/components/generation/ProgressModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useProgressPolling, convertToFlashCardProposals } from '@/hooks/useGenerationApi';
import type { 
  ProcessingGenerationDto, 
  CompletedGenerationDto, 
  FailedGenerationDto 
} from '@/types';
import type { FlashCardProposal } from '@/lib/view-models';

interface ProgressModalProps {
  isOpen: boolean;
  generationId: string | null;
  onComplete: (proposals: FlashCardProposal[]) => void;
  onFailed: (error: string) => void;
  onRetry: () => void;
  onCancel: () => void;
  className?: string;
}

export function ProgressModal({
  isOpen,
  generationId,
  onComplete,
  onFailed,
  onRetry,
  onCancel,
  className,
}: ProgressModalProps) {
  const [currentStatus, setCurrentStatus] = useState<ProcessingGenerationDto | CompletedGenerationDto | FailedGenerationDto | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const { isPolling, pollingError, startPolling, stopPolling } = useProgressPolling(
    generationId,
    (data) => {
      setCurrentStatus(data);
      
      if (data.status === 'completed') {
        const proposals = convertToFlashCardProposals(data as CompletedGenerationDto);
        onComplete(proposals);
      } else if (data.status === 'failed') {
        const failedData = data as FailedGenerationDto;
        onFailed(failedData.error.message);
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

  // Start polling when modal opens
  useEffect(() => {
    console.log(`ProgressModal effect: isOpen=${isOpen}, generationId=${generationId}`);
    
    if (isOpen && generationId) {
      console.log(`Starting polling for modal with generation ${generationId}`);
      startPolling();
    } else {
      console.log(`Stopping polling for modal`);
      stopPolling();
      setCurrentStatus(null);
    }
    
    // Cleanup on unmount
    return () => {
      console.log(`ProgressModal cleanup: stopping polling`);
      stopPolling();
    };
  }, [isOpen, generationId, startPolling, stopPolling]);

  // Calculate time remaining based on estimated duration
  useEffect(() => {
    if (currentStatus?.status === 'processing') {
      const processingData = currentStatus as ProcessingGenerationDto;
      const estimatedTotal = 60000; // 60 seconds estimated for AI generation
      const elapsed = (100 - processingData.progress) / 100 * estimatedTotal;
      setTimeRemaining(Math.max(0, Math.round(elapsed / 1000)));
    } else {
      setTimeRemaining(null);
    }
  }, [currentStatus]);

  const getStatusMessage = () => {
    if (!currentStatus) {
      return 'Initializing generation...';
    }

    switch (currentStatus.status) {
      case 'processing':
        const processingData = currentStatus as ProcessingGenerationDto;
        return processingData.message || 'Processing your text...';
      case 'completed':
        return 'Generation completed successfully!';
      case 'failed':
        return 'Generation failed. Please try again.';
      default:
        return 'Processing...';
    }
  };

  const getProgressValue = () => {
    if (!currentStatus || currentStatus.status !== 'processing') {
      return 0;
    }
    return (currentStatus as ProcessingGenerationDto).progress;
  };

  const isCompleted = currentStatus?.status === 'completed';
  const isFailed = currentStatus?.status === 'failed' || pollingError;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCompleted ? (
              <>
                <svg 
                  className="w-5 h-5 text-green-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
                Generation Complete
              </>
            ) : isFailed ? (
              <>
                <svg 
                  className="w-5 h-5 text-red-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                Generation Failed
              </>
            ) : (
              <>
                <svg 
                  className="w-5 h-5 text-primary animate-spin" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating Flashcards
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {getStatusMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress bar */}
          {!isCompleted && !isFailed && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{getProgressValue()}%</span>
              </div>
              <Progress value={getProgressValue()} className="h-2" />
            </div>
          )}

          {/* Time remaining */}
          {timeRemaining !== null && timeRemaining > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Estimated time remaining: {timeRemaining}s
            </div>
          )}

          {/* Error details */}
          {isFailed && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                {pollingError || (currentStatus as FailedGenerationDto)?.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
          )}

          {/* Success message */}
          {isCompleted && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Your flashcards have been generated successfully! You can now review and edit them.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {isFailed ? (
              <>
                <Button
                  onClick={onRetry}
                  className="flex-1"
                  variant="default"
                >
                  <svg 
                    className="w-4 h-4 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                  Try Again
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </>
            ) : isCompleted ? (
              <Button
                onClick={onCancel}
                className="flex-1"
                variant="default"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1"
                disabled={isPolling}
              >
                Cancel
              </Button>
            )}
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
