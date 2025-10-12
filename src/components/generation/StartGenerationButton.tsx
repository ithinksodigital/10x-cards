// src/components/generation/StartGenerationButton.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StartGenerationCommand } from '@/types';

interface StartGenerationButtonProps {
  command: StartGenerationCommand;
  disabled?: boolean;
  isLoading?: boolean;
  onClick: (command: StartGenerationCommand) => void;
  className?: string;
}

export function StartGenerationButton({
  command,
  disabled = false,
  isLoading = false,
  onClick,
  className,
}: StartGenerationButtonProps) {
  const handleClick = () => {
    if (!disabled && !isLoading) {
      onClick(command);
    }
  };

  const isDisabled = disabled || isLoading || !command.source_text.trim();

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        'w-full sm:w-auto',
        'bg-blue-600 hover:bg-blue-700',
        'text-white font-medium',
        'px-8 py-3',
        'rounded-lg',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg 
            className="w-5 h-5 animate-spin" 
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
          <span>Generating...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <svg 
            className="w-5 h-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
          <span>Generate Flashcards</span>
        </div>
      )}
    </Button>
  );
}

/**
 * Helper component for displaying generation button with error state
 */
interface GenerationButtonWithErrorProps extends StartGenerationButtonProps {
  error?: string | null;
  onRetry?: () => void;
}

export function GenerationButtonWithError({
  error,
  onRetry,
  ...buttonProps
}: GenerationButtonWithErrorProps) {
  if (error) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg 
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" 
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
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Generation Failed</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50"
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
        )}
      </div>
    );
  }

  return <StartGenerationButton {...buttonProps} />;
}
