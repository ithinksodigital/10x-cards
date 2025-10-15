// src/components/generation/SaveToSetDialog.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSetsApi } from "@/hooks/useSetsApi";
import type { BatchCreateCardsCommand } from "@/types";
import type { FlashCardProposal } from "@/lib/view-models";
import type { CreateSetCommand } from "@/types";

interface SaveToSetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (response: unknown) => void;
  selectedCards: FlashCardProposal[];
  generationId: string;
  className?: string;
}

const MAX_CARDS_PER_SET = 200;
const MAX_CARDS_PER_ACCOUNT = 1000;

export function SaveToSetDialog({
  isOpen,
  onClose,
  onSaveSuccess,
  selectedCards,
  generationId,
  className,
}: SaveToSetDialogProps) {
  const [selectedSetId, setSelectedSetId] = useState<string | undefined>(undefined);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetLanguage, setNewSetLanguage] = useState<"pl" | "en" | "es">("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { sets, fetchSets, createSet, batchCreateCards, isLoading, error } = useSetsApi();

  // Fetch sets when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchSets().catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
      });
    }
  }, [isOpen, fetchSets]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSetId(undefined);
      setIsCreatingNew(false);
      setNewSetName("");
      setNewSetLanguage("en");
      setSearchQuery("");
      setSubmitError(null);
    }
  }, [isOpen]);

  const filteredSets = sets.filter((set) => set.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const selectedSet = sets.find((set) => set.id === selectedSetId);

  // Calculate available slots
  const availableSlotsInSet = selectedSet ? MAX_CARDS_PER_SET - selectedSet.cards_count : MAX_CARDS_PER_SET;
  const totalCardsInAccount = sets.reduce((sum, set) => sum + set.cards_count, 0);
  const availableSlotsInAccount = MAX_CARDS_PER_ACCOUNT - totalCardsInAccount;

  const canSave =
    selectedCards.length > 0 &&
    selectedCards.length <= availableSlotsInSet &&
    selectedCards.length <= availableSlotsInAccount &&
    (selectedSetId || (isCreatingNew && newSetName.trim()));

  const handleSave = useCallback(async () => {
    if (!canSave) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let targetSetId = selectedSetId;

      // Create new set if needed
      if (isCreatingNew) {
        const createCommand: CreateSetCommand = {
          name: newSetName.trim(),
          language: newSetLanguage,
        };
        const newSet = await createSet(createCommand);
        targetSetId = newSet.id;
      }

      // Prepare batch create command
      const batchCommand: BatchCreateCardsCommand = {
        generation_id: generationId,
        cards: selectedCards.map((card) => ({
          front: card.front,
          back: card.back,
          source_text_excerpt: card.source_text_excerpt,
          ai_confidence_score: card.ai_confidence_score,
          was_edited: card.was_edited,
          original_front: card.original_front,
          original_back: card.original_back,
        })),
      };

      // Save cards to set
      const response = await batchCreateCards(targetSetId, batchCommand);
      onSaveSuccess(response);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save cards";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canSave,
    selectedSetId,
    isCreatingNew,
    newSetName,
    newSetLanguage,
    generationId,
    selectedCards,
    createSet,
    batchCreateCards,
    onSaveSuccess,
    onClose,
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-lg", className)} data-testid="set-selection-modal">
        <DialogHeader>
          <DialogTitle>Save Flashcards to Set</DialogTitle>
          <DialogDescription>
            Choose an existing set or create a new one to save your {selectedCards.length} selected flashcards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selection mode */}
          <div className="flex gap-2">
            <Button
              variant={!isCreatingNew ? "default" : "outline"}
              onClick={() => setIsCreatingNew(false)}
              className="flex-1"
            >
              Choose Existing Set
            </Button>
            <Button
              variant={isCreatingNew ? "default" : "outline"}
              onClick={() => setIsCreatingNew(true)}
              className="flex-1"
            >
              Create New Set
            </Button>
          </div>

          {/* Existing set selection */}
          {!isCreatingNew && (
            <div className="space-y-4">
              <div>
                <label htmlFor="search-sets" className="text-sm font-medium text-foreground mb-2 block">
                  Search sets
                </label>
                <Input
                  id="search-sets"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="select-set" className="text-sm font-medium text-foreground mb-2 block">
                  Select set
                </label>
                <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                  <SelectTrigger id="select-set">
                    <SelectValue placeholder="Choose a set..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading sets...
                      </SelectItem>
                    ) : filteredSets.length === 0 ? (
                      <SelectItem value="no-sets" disabled>
                        No sets found
                      </SelectItem>
                    ) : (
                      filteredSets.map((set) => (
                        <SelectItem key={set.id} value={set.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{set.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {set.cards_count}/{MAX_CARDS_PER_SET} cards
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* New set creation */}
          {isCreatingNew && (
            <div className="space-y-4">
              <div>
                <label htmlFor="set-name" className="text-sm font-medium text-foreground mb-2 block">
                  Set name
                </label>
                <Input
                  id="set-name"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="Enter set name..."
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="set-language" className="text-sm font-medium text-foreground mb-2 block">
                  Language
                </label>
                <Select value={newSetLanguage} onValueChange={(value: "pl" | "en" | "es") => setNewSetLanguage(value)}>
                  <SelectTrigger id="set-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pl">Polish</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Limits and validation */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="text-sm font-medium text-foreground">Validation</div>

            <div className="space-y-1 text-sm">
              <div
                className={cn(
                  "flex items-center gap-2",
                  selectedCards.length <= availableSlotsInSet ? "text-green-600" : "text-red-600"
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    selectedCards.length <= availableSlotsInSet ? "bg-green-500" : "bg-red-500"
                  )}
                />
                <span>
                  Set capacity: {selectedCards.length} / {availableSlotsInSet} available slots
                </span>
              </div>

              <div
                className={cn(
                  "flex items-center gap-2",
                  selectedCards.length <= availableSlotsInAccount ? "text-green-600" : "text-red-600"
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    selectedCards.length <= availableSlotsInAccount ? "bg-green-500" : "bg-red-500"
                  )}
                />
                <span>
                  Account limit: {selectedCards.length} / {availableSlotsInAccount} available slots
                </span>
              </div>
            </div>
          </div>

          {/* Error display */}
          {(error || submitError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{submitError || error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave || isSubmitting} className="flex-1">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </div>
              ) : (
                `Save ${selectedCards.length} Cards`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing save dialog state
 */
export function useSaveToSetDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  return {
    isOpen,
    openDialog,
    closeDialog,
  };
}
