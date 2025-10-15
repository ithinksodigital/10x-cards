// src/components/generation/GeneratePage.tsx
import React, { useState, useCallback } from "react";
import { GenerationStepper, useGenerationStepper } from "./GenerationStepper";
import { PasteTextarea } from "./PasteTextarea";
import { GenerationButtonWithError } from "./StartGenerationButton";
import { ProgressModal, useProgressModal } from "./ProgressModal";
import { CardGrid, useCardGrid } from "./CardGrid";
import { BulkActionsBar, useBulkActions } from "./BulkActionsBar";
import { SaveToSetDialog, useSaveToSetDialog } from "./SaveToSetDialog";
import { ErrorToast, useErrorToast } from "./ErrorToast";
import { useGeneration } from "./GenerationContext";
import { useGenerationApi } from "@/hooks/useGenerationApi";
import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
import type { StartGenerationCommand } from "@/types";
import type { FlashCardProposal } from "@/lib/view-models";

export function GeneratePage() {
  const {
    state,
    startGeneration,
    setProposals,
    acceptCard,
    rejectCard,
    editCard,
    acceptAllBatch,
    rejectAllBatch,
    undo,
    setCurrentBatch,
    // setStatus,
    setError,
    reset,
  } = useGeneration();
  const { currentStep, nextStep, reset: resetStepper } = useGenerationStepper();
  const { isGenerating, error: apiError, startGeneration: apiStartGeneration, retryGeneration } = useGenerationApi();
  const { isOpen: isProgressOpen, generationId, openModal, closeModal } = useProgressModal();
  const { isOpen: isSaveOpen, openDialog: openSaveDialog, closeDialog: closeSaveDialog } = useSaveToSetDialog();
  const { toasts, addToast, removeToast } = useErrorToast();

  const [pasteText, setPasteText] = useState("");
  const [pasteValid, setPasteValid] = useState(false);
  const [pasteErrors, setPasteErrors] = useState<Record<string, string>>({});

  const { currentBatch, goToBatch } = useCardGrid(state.proposals);
  const { canUndo, undoCount, acceptAll, rejectAll } = useBulkActions(
    state.proposals,
    state.selectedIds,
    state.rejectedIds,
    currentBatch,
    state.undoStack,
    acceptCard,
    rejectCard
  );

  // Handle paste text changes
  const handlePasteChange = useCallback((text: string) => {
    setPasteText(text);
  }, []);

  const handlePasteValidation = useCallback((isValid: boolean, errors?: Record<string, string>) => {
    setPasteValid(isValid);
    setPasteErrors(errors || {});
  }, []);

  // Handle generation start
  const handleStartGeneration = useCallback(
    async (command: StartGenerationCommand) => {
      try {
        const response = await apiStartGeneration(command);
        startGeneration(response.id);
        openModal(response.id);
        nextStep(); // Move to review step
      } catch (err) {
        // Error handling is done by the error toast system
      }
    },
    [apiStartGeneration, startGeneration, openModal, nextStep]
  );

  // Handle generation completion
  const handleGenerationComplete = useCallback(
    (proposals: FlashCardProposal[]) => {
      setProposals(proposals);
      closeModal();
    },
    [setProposals, closeModal]
  );

  // Handle retry
  const handleRetry = useCallback(async () => {
    if (state.generationId) {
      try {
        await retryGeneration(state.generationId);
        openModal(state.generationId);
      } catch (err) {
        // Error handling is done by the error toast system
      }
    }
  }, [state.generationId, retryGeneration, openModal]);

  // Handle generation failure
  const handleGenerationFailed = useCallback(
    (error: string) => {
      setError(error);
      closeModal();
      addToast(error, "error", handleRetry);
    },
    [setError, closeModal, addToast, handleRetry]
  );

  // Handle save to set
  const handleSaveSuccess = useCallback(
    (response: unknown) => {
      // Show success message and redirect or reset
      reset();
      resetStepper();
      setPasteText("");
    },
    [reset, resetStepper]
  );

  // Handle batch change
  const handleBatchChange = useCallback(
    (batchIndex: number) => {
      setCurrentBatch(batchIndex);
      goToBatch(batchIndex);
    },
    [setCurrentBatch, goToBatch]
  );

  // Get selected cards for saving
  const selectedCards = state.proposals.filter((proposal) => state.selectedIds.has(proposal.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Generate Flashcards</h1>
          <p className="text-lg text-muted-foreground">Transform your text into interactive flashcards using AI</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <GenerationStepper currentStep={currentStep} />
        </div>

        {/* Main content */}
        <div className="space-y-8">
          {/* Step 1: Paste Text */}
          {currentStep === "paste" && (
            <div className="w-full">
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h2 className="text-xl font-semibold text-card-foreground mb-4">Step 1: Paste Your Text</h2>
                <p className="text-muted-foreground mb-6">
                  Paste or type your text content. The AI will analyze it and generate relevant flashcards.
                </p>

                <PasteTextarea
                  value={pasteText}
                  onChange={handlePasteChange}
                  onValidationChange={handlePasteValidation}
                  className="mb-6"
                />

                <div className="flex justify-center">
                  <GenerationButtonWithError
                    command={{
                      source_text: pasteText,
                      target_count: 30,
                    }}
                    disabled={!pasteValid}
                    isLoading={isGenerating}
                    onClick={handleStartGeneration}
                    error={apiError}
                    onRetry={handleRetry}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review Cards */}
          {currentStep === "review" && (
            <div className="space-y-6">
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h2 className="text-xl font-semibold text-card-foreground mb-4">Step 2: Review Generated Cards</h2>
                <p className="text-muted-foreground mb-6">
                  Review the generated flashcards. Accept the ones you want to keep, reject the others, and edit as
                  needed.
                </p>
              </div>

              {/* Bulk Actions */}
              <BulkActionsBar
                proposals={state.proposals}
                selectedIds={state.selectedIds}
                rejectedIds={state.rejectedIds}
                currentBatch={currentBatch}
                canUndo={canUndo}
                undoCount={undoCount}
                onAcceptAll={acceptAll}
                onRejectAll={rejectAll}
                onAcceptAllBatch={acceptAllBatch}
                onRejectAllBatch={rejectAllBatch}
                onUndo={undo}
              />

              {/* Cards Grid */}
              <CardGrid
                proposals={state.proposals}
                selectedIds={state.selectedIds}
                rejectedIds={state.rejectedIds}
                currentBatch={currentBatch}
                onAccept={acceptCard}
                onReject={rejectCard}
                onEditSave={editCard}
                onBatchChange={handleBatchChange}
              />

              {/* Continue to Save */}
              {selectedCards.length > 0 && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => nextStep()}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium"
                    size="lg"
                  >
                    Continue to Save ({selectedCards.length} cards selected)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Save to Set */}
          {currentStep === "save" && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h2 className="text-xl font-semibold text-card-foreground mb-4">Step 3: Save to Set</h2>
                <p className="text-muted-foreground mb-6">
                  Choose an existing set or create a new one to save your {selectedCards.length} selected flashcards.
                </p>

                <div className="text-center">
                  <Button onClick={openSaveDialog} className="px-8 py-3 font-medium" size="lg">
                    Choose Set or Create New
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Modal */}
        <ProgressModal
          isOpen={isProgressOpen}
          generationId={generationId}
          onComplete={handleGenerationComplete}
          onFailed={handleGenerationFailed}
          onRetry={handleRetry}
          onCancel={closeModal}
        />

        {/* Save Dialog */}
        <SaveToSetDialog
          isOpen={isSaveOpen}
          onClose={closeSaveDialog}
          onSaveSuccess={handleSaveSuccess}
          selectedCards={selectedCards}
          generationId={state.generationId || ""}
        />

        {/* Error Toasts */}
        {toasts.map((toast) => (
          <ErrorToast
            key={toast.id}
            error={toast.error}
            type={toast.type}
            onDismiss={() => removeToast(toast.id)}
            onRetry={toast.onRetry}
          />
        ))}
      </div>
    </div>
  );
}
