// src/components/generation/ErrorToast.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface ErrorToastProps {
  error: string;
  onDismiss: () => void;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info';
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  className?: string;
}

export function ErrorToast({
  error,
  onDismiss,
  onRetry,
  type = 'error',
  autoDismiss = true,
  autoDismissDelay = 5000,
  className,
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissDelay, onDismiss]);

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-primary/10 border-primary/20 text-primary';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-md w-full',
        'transform transition-all duration-300 ease-in-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        className
      )}
    >
      <Alert className={cn('shadow-lg', getTypeStyles())}>
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <AlertDescription className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {type === 'error' && 'Error occurred'}
                {type === 'warning' && 'Warning'}
                {type === 'info' && 'Information'}
              </p>
              <p className="text-sm mt-1 break-words">
                {error}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="text-xs h-6 px-2"
                >
                  Retry
                </Button>
              )}
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 hover:bg-black/10 rounded"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Hook for managing error toasts
 */
export function useErrorToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    error: string;
    type?: 'error' | 'warning' | 'info';
    onRetry?: () => void;
  }>>([]);

  const addToast = (error: string, type: 'error' | 'warning' | 'info' = 'error', onRetry?: () => void) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, error, type, onRetry }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
  };
}
