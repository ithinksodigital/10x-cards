// src/components/generation/BulkActionsBar.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { FlashCardProposal } from '@/lib/view-models';

interface BulkActionsBarProps {
  proposals: FlashCardProposal[];
  selectedIds: Set<string>;
  rejectedIds: Set<string>;
  currentBatch: number;
  canUndo: boolean;
  undoCount: number;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onAcceptAllBatch: () => void;
  onRejectAllBatch: () => void;
  onUndo: () => void;
  onSelectAllInBatch: () => void;
  className?: string;
}

const BATCH_SIZE = 10;

export function BulkActionsBar({
  proposals,
  selectedIds,
  rejectedIds,
  currentBatch,
  canUndo,
  undoCount,
  onAcceptAll,
  onRejectAll,
  onAcceptAllBatch,
  onRejectAllBatch,
  onUndo,
  onSelectAllInBatch,
  className,
}: BulkActionsBarProps) {
  const [showAcceptAllDialog, setShowAcceptAllDialog] = useState(false);
  const [showRejectAllDialog, setShowRejectAllDialog] = useState(false);
  const [showAcceptBatchDialog, setShowAcceptBatchDialog] = useState(false);
  const [showRejectBatchDialog, setShowRejectBatchDialog] = useState(false);

  // Calculate batch statistics
  const batchStartIdx = currentBatch * BATCH_SIZE;
  const batchEndIdx = Math.min(batchStartIdx + BATCH_SIZE, proposals.length);
  const batchCards = proposals.slice(batchStartIdx, batchEndIdx);
  
  const batchAcceptedCount = batchCards.filter(card => selectedIds.has(card.id)).length;
  const batchRejectedCount = batchCards.filter(card => rejectedIds.has(card.id)).length;
  const batchRemainingCount = batchCards.length - batchAcceptedCount - batchRejectedCount;
  
  const totalAcceptedCount = selectedIds.size;
  const totalRejectedCount = rejectedIds.size;
  const totalRemainingCount = proposals.length - totalAcceptedCount - totalRejectedCount;

  const hasUnreviewedCards = totalRemainingCount > 0;
  const hasUnreviewedInBatch = batchRemainingCount > 0;

  return (
    <div className={cn('flex flex-wrap items-center gap-2 p-4 bg-white border rounded-lg shadow-sm', className)}>
      {/* Batch actions */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Batch {currentBatch + 1}:</span>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAcceptBatchDialog(true)}
          disabled={!hasUnreviewedInBatch}
          className="text-green-700 border-green-300 hover:bg-green-50"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Accept All ({batchRemainingCount})
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRejectBatchDialog(true)}
          disabled={!hasUnreviewedInBatch}
          className="text-red-700 border-red-300 hover:bg-red-50"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject All ({batchRemainingCount})
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Global actions */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">All cards:</span>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAcceptAllDialog(true)}
          disabled={!hasUnreviewedCards}
          className="text-green-700 border-green-300 hover:bg-green-50"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Accept All ({totalRemainingCount})
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRejectAllDialog(true)}
          disabled={!hasUnreviewedCards}
          className="text-red-700 border-red-300 hover:bg-red-50"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject All ({totalRemainingCount})
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Undo action */}
      <Button
        size="sm"
        variant="outline"
        onClick={onUndo}
        disabled={!canUndo}
        className="text-blue-700 border-blue-300 hover:bg-blue-50"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Undo ({undoCount})
      </Button>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Statistics */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>{totalAcceptedCount} accepted</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>{totalRejectedCount} rejected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span>{totalRemainingCount} remaining</span>
        </div>
      </div>

      {/* Confirmation dialogs */}
      
      {/* Accept All Dialog */}
      <AlertDialog open={showAcceptAllDialog} onOpenChange={setShowAcceptAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept All Remaining Cards</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to accept all {totalRemainingCount} remaining cards? 
              This action cannot be undone, but you can use the undo feature to reverse recent actions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onAcceptAll();
                setShowAcceptAllDialog(false);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept All {totalRemainingCount} Cards
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject All Dialog */}
      <AlertDialog open={showRejectAllDialog} onOpenChange={setShowRejectAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject All Remaining Cards</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject all {totalRemainingCount} remaining cards? 
              This action cannot be undone, but you can use the undo feature to reverse recent actions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRejectAll();
                setShowRejectAllDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject All {totalRemainingCount} Cards
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept Batch Dialog */}
      <AlertDialog open={showAcceptBatchDialog} onOpenChange={setShowAcceptBatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept All Cards in Batch {currentBatch + 1}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to accept all {batchRemainingCount} remaining cards in this batch? 
              This action cannot be undone, but you can use the undo feature to reverse recent actions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onAcceptAllBatch();
                setShowAcceptBatchDialog(false);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept All {batchRemainingCount} Cards
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Batch Dialog */}
      <AlertDialog open={showRejectBatchDialog} onOpenChange={setShowRejectBatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject All Cards in Batch {currentBatch + 1}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject all {batchRemainingCount} remaining cards in this batch? 
              This action cannot be undone, but you can use the undo feature to reverse recent actions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRejectAllBatch();
                setShowRejectBatchDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject All {batchRemainingCount} Cards
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Hook for managing bulk actions
 */
export function useBulkActions(
  proposals: FlashCardProposal[],
  selectedIds: Set<string>,
  rejectedIds: Set<string>,
  currentBatch: number,
  undoStack: any[],
  onAcceptCard: (cardId: string) => void,
  onRejectCard: (cardId: string) => void,
  onAcceptAllBatch: () => void,
  onRejectAllBatch: () => void,
  onUndo: () => void
) {
  const canUndo = undoStack.length > 0;
  const undoCount = undoStack.length;

  const acceptAll = () => {
    proposals.forEach(proposal => {
      if (!selectedIds.has(proposal.id) && !rejectedIds.has(proposal.id)) {
        onAcceptCard(proposal.id);
      }
    });
  };

  const rejectAll = () => {
    proposals.forEach(proposal => {
      if (!selectedIds.has(proposal.id) && !rejectedIds.has(proposal.id)) {
        onRejectCard(proposal.id);
      }
    });
  };

  return {
    canUndo,
    undoCount,
    acceptAll,
    rejectAll,
  };
}
