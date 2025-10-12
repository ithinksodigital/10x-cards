// src/components/generation/CardGrid.tsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlashCard } from "./FlashCard";
import { cn } from "@/lib/utils";
import type { FlashCardProposal } from "@/lib/view-models";

interface CardGridProps {
  proposals: FlashCardProposal[];
  selectedIds: Set<string>;
  rejectedIds: Set<string>;
  currentBatch: number;
  onAccept: (cardId: string) => void;
  onReject: (cardId: string) => void;
  onEditSave: (cardId: string, front: string, back: string) => void;
  onBatchChange: (batchIndex: number) => void;
  className?: string;
}

const BATCH_SIZE = 10;

export function CardGrid({
  proposals,
  selectedIds,
  rejectedIds,
  currentBatch,
  onAccept,
  onReject,
  onEditSave,
  onBatchChange,
  className,
}: CardGridProps) {
  // Calculate batch information
  const batchInfo = useMemo(() => {
    const totalBatches = Math.ceil(proposals.length / BATCH_SIZE);
    const batches = [];

    for (let i = 0; i < totalBatches; i++) {
      const startIdx = i * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, proposals.length);
      const batchCards = proposals.slice(startIdx, endIdx);

      const acceptedCount = batchCards.filter((card) => selectedIds.has(card.id)).length;
      const rejectedCount = batchCards.filter((card) => rejectedIds.has(card.id)).length;

      batches.push({
        index: i,
        cards: batchCards,
        acceptedCount,
        rejectedCount,
        remainingCount: batchCards.length - acceptedCount - rejectedCount,
      });
    }

    return { totalBatches, batches };
  }, [proposals, selectedIds, rejectedIds]);

  const currentBatchData = batchInfo.batches[currentBatch];

  if (proposals.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-lg font-medium">No flashcards generated yet</p>
          <p className="text-sm">Start by pasting your text and generating flashcards</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Batch navigation tabs */}
      {batchInfo.totalBatches > 1 && (
        <Tabs value={currentBatch.toString()} onValueChange={(value) => onBatchChange(parseInt(value))}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
            {batchInfo.batches.map((batch) => (
              <TabsTrigger
                key={batch.index}
                value={batch.index.toString()}
                className="flex flex-col items-center gap-1 p-2"
              >
                <span className="text-sm font-medium">Batch {batch.index + 1}</span>
                <div className="flex gap-1 text-xs">
                  <span className="text-green-600">{batch.acceptedCount}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-red-600">{batch.rejectedCount}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">{batch.remainingCount}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Batch summary */}
      {currentBatchData && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">Batch {currentBatch + 1}</span>
              <span className="text-muted-foreground ml-2">({currentBatchData.cards.length} cards)</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-700">{currentBatchData.acceptedCount} accepted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-700">{currentBatchData.rejectedCount} rejected</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                <span className="text-muted-foreground">{currentBatchData.remainingCount} remaining</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {currentBatchData.acceptedCount + currentBatchData.rejectedCount} of {currentBatchData.cards.length}{" "}
            reviewed
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentBatchData?.cards.map((proposal, index) => {
          const globalIndex = currentBatch * BATCH_SIZE + index;
          const isSelected = selectedIds.has(proposal.id);
          const isRejected = rejectedIds.has(proposal.id);

          return (
            <FlashCard
              key={proposal.id}
              proposal={proposal}
              index={globalIndex}
              isSelected={isSelected}
              isRejected={isRejected}
              onAccept={onAccept}
              onReject={onReject}
              onEditSave={onEditSave}
              className="group"
            />
          );
        })}
      </div>

      {/* Batch navigation buttons for mobile */}
      {batchInfo.totalBatches > 1 && (
        <div className="flex items-center justify-between md:hidden">
          <button
            onClick={() => onBatchChange(Math.max(0, currentBatch - 1))}
            disabled={currentBatch === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <span className="text-sm text-muted-foreground">
            {currentBatch + 1} of {batchInfo.totalBatches}
          </span>

          <button
            onClick={() => onBatchChange(Math.min(batchInfo.totalBatches - 1, currentBatch + 1))}
            disabled={currentBatch === batchInfo.totalBatches - 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span>
            {selectedIds.size + rejectedIds.size} of {proposals.length} cards reviewed
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing card grid state
 */
export function useCardGrid(proposals: FlashCardProposal[]) {
  const [currentBatch, setCurrentBatch] = useState(0);

  const totalBatches = Math.ceil(proposals.length / BATCH_SIZE);

  // Reset to first batch if current batch is out of range
  useEffect(() => {
    if (currentBatch >= totalBatches && totalBatches > 0) {
      setCurrentBatch(0);
    }
  }, [currentBatch, totalBatches]);

  const goToNextBatch = useCallback(() => {
    setCurrentBatch((prev) => Math.min(prev + 1, totalBatches - 1));
  }, [totalBatches]);

  const goToPreviousBatch = useCallback(() => {
    setCurrentBatch((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToBatch = useCallback(
    (batchIndex: number) => {
      setCurrentBatch(Math.max(0, Math.min(batchIndex, totalBatches - 1)));
    },
    [totalBatches]
  );

  return {
    currentBatch,
    totalBatches,
    goToNextBatch,
    goToPreviousBatch,
    goToBatch,
  };
}
