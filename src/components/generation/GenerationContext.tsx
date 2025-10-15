// src/components/generation/GenerationContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from "react";
import type { GenerationState, FlashCardProposal } from "@/lib/view-models";

interface GenerationContextValue {
  state: GenerationState;
  startGeneration: (generationId: string) => void;
  setProposals: (proposals: FlashCardProposal[]) => void;
  acceptCard: (cardId: string) => void;
  rejectCard: (cardId: string) => void;
  toggleSelect: (cardId: string) => void;
  editCard: (cardId: string, front: string, back: string) => void;
  acceptAllBatch: () => void;
  rejectAllBatch: () => void;
  undo: () => void;
  setCurrentBatch: (batchIndex: number) => void;
  setStatus: (status: GenerationState["status"]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

type GenerationAction =
  | { type: "START_GENERATION"; generationId: string }
  | { type: "SET_PROPOSALS"; proposals: FlashCardProposal[] }
  | { type: "ACCEPT_CARD"; cardId: string }
  | { type: "REJECT_CARD"; cardId: string }
  | { type: "TOGGLE_SELECT"; cardId: string }
  | { type: "EDIT_CARD"; cardId: string; front: string; back: string }
  | { type: "ACCEPT_ALL_BATCH"; batchIndex: number }
  | { type: "REJECT_ALL_BATCH"; batchIndex: number }
  | { type: "UNDO" }
  | { type: "SET_CURRENT_BATCH"; batchIndex: number }
  | { type: "SET_STATUS"; status: GenerationState["status"] }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "RESET" };

const initialState: GenerationState = {
  generationId: null,
  status: "idle",
  proposals: [],
  selectedIds: new Set(),
  rejectedIds: new Set(),
  edits: {},
  currentBatch: 0,
  undoStack: [],
  error: null,
};

const BATCH_SIZE = 10;
const MAX_UNDO_STACK = 5;

function generationReducer(state: GenerationState, action: GenerationAction): GenerationState {
  switch (action.type) {
    case "START_GENERATION":
      return {
        ...initialState,
        generationId: action.generationId,
        status: "processing",
      };

    case "SET_PROPOSALS":
      return {
        ...state,
        proposals: action.proposals,
        status: "completed",
      };

    case "ACCEPT_CARD": {
      const newSelectedIds = new Set(state.selectedIds);
      const newRejectedIds = new Set(state.rejectedIds);

      if (newSelectedIds.has(action.cardId)) {
        return state; // Already accepted
      }

      newSelectedIds.add(action.cardId);
      newRejectedIds.delete(action.cardId);

      const newUndoStack = [...state.undoStack, { type: "accept" as const, cardId: action.cardId }];
      if (newUndoStack.length > MAX_UNDO_STACK) {
        newUndoStack.shift();
      }

      return {
        ...state,
        selectedIds: newSelectedIds,
        rejectedIds: newRejectedIds,
        undoStack: newUndoStack,
      };
    }

    case "REJECT_CARD": {
      const newSelectedIds = new Set(state.selectedIds);
      const newRejectedIds = new Set(state.rejectedIds);

      if (newRejectedIds.has(action.cardId)) {
        return state; // Already rejected
      }

      newRejectedIds.add(action.cardId);
      newSelectedIds.delete(action.cardId);

      const newUndoStack = [...state.undoStack, { type: "reject" as const, cardId: action.cardId }];
      if (newUndoStack.length > MAX_UNDO_STACK) {
        newUndoStack.shift();
      }

      return {
        ...state,
        selectedIds: newSelectedIds,
        rejectedIds: newRejectedIds,
        undoStack: newUndoStack,
      };
    }

    case "TOGGLE_SELECT": {
      const newSelectedIds = new Set(state.selectedIds);

      if (newSelectedIds.has(action.cardId)) {
        newSelectedIds.delete(action.cardId);
      } else {
        newSelectedIds.add(action.cardId);
      }

      return {
        ...state,
        selectedIds: newSelectedIds,
      };
    }

    case "EDIT_CARD": {
      const card = state.proposals.find((p) => p.id === action.cardId);
      if (!card) return state;

      const previousState = {
        front: card.front,
        back: card.back,
      };

      const newProposals = state.proposals.map((p) =>
        p.id === action.cardId
          ? {
              ...p,
              front: action.front,
              back: action.back,
              was_edited: true,
              original_front: p.original_front || p.front,
              original_back: p.original_back || p.back,
            }
          : p
      );

      const newUndoStack = [...state.undoStack, { type: "edit" as const, cardId: action.cardId, previousState }];
      if (newUndoStack.length > MAX_UNDO_STACK) {
        newUndoStack.shift();
      }

      return {
        ...state,
        proposals: newProposals,
        undoStack: newUndoStack,
      };
    }

    case "ACCEPT_ALL_BATCH": {
      const startIdx = action.batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, state.proposals.length);
      const batchCards = state.proposals.slice(startIdx, endIdx);

      const newSelectedIds = new Set(state.selectedIds);
      const newRejectedIds = new Set(state.rejectedIds);

      batchCards.forEach((card) => {
        newSelectedIds.add(card.id);
        newRejectedIds.delete(card.id);
      });

      return {
        ...state,
        selectedIds: newSelectedIds,
        rejectedIds: newRejectedIds,
      };
    }

    case "REJECT_ALL_BATCH": {
      const startIdx = action.batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, state.proposals.length);
      const batchCards = state.proposals.slice(startIdx, endIdx);

      const newSelectedIds = new Set(state.selectedIds);
      const newRejectedIds = new Set(state.rejectedIds);

      batchCards.forEach((card) => {
        newRejectedIds.add(card.id);
        newSelectedIds.delete(card.id);
      });

      return {
        ...state,
        selectedIds: newSelectedIds,
        rejectedIds: newRejectedIds,
      };
    }

    case "UNDO": {
      if (state.undoStack.length === 0) return state;

      const action = state.undoStack[state.undoStack.length - 1];
      const newUndoStack = state.undoStack.slice(0, -1);

      const newState = { ...state, undoStack: newUndoStack };

      if (action.type === "accept") {
        const newSelectedIds = new Set(state.selectedIds);
        newSelectedIds.delete(action.cardId);
        newState.selectedIds = newSelectedIds;
      } else if (action.type === "reject") {
        const newRejectedIds = new Set(state.rejectedIds);
        newRejectedIds.delete(action.cardId);
        newState.rejectedIds = newRejectedIds;
      } else if (action.type === "edit") {
        newState.proposals = state.proposals.map((p) =>
          p.id === action.cardId
            ? {
                ...p,
                front: action.previousState.front,
                back: action.previousState.back,
                was_edited: false,
              }
            : p
        );
      }

      return newState;
    }

    case "SET_CURRENT_BATCH":
      return {
        ...state,
        currentBatch: action.batchIndex,
      };

    case "SET_STATUS":
      return {
        ...state,
        status: action.status,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.error,
        status: action.error ? "failed" : state.status,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

const GenerationContext = createContext<GenerationContextValue | undefined>(undefined);

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(generationReducer, initialState);
  const [, setIsInitialized] = useState(false);

  // Persist state to sessionStorage (with TTL 24h)
  useEffect(() => {
    if (state.generationId) {
      const serializedState = {
        generationId: state.generationId,
        proposals: state.proposals,
        selectedIds: Array.from(state.selectedIds),
        rejectedIds: Array.from(state.rejectedIds),
        currentBatch: state.currentBatch,
        timestamp: Date.now(),
      };
      sessionStorage.setItem("generation-state", JSON.stringify(serializedState));
    }
  }, [state]);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("generation-state");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const TTL = 24 * 60 * 60 * 1000; // 24 hours

        if (Date.now() - parsed.timestamp < TTL) {
          dispatch({ type: "START_GENERATION", generationId: parsed.generationId });
          dispatch({ type: "SET_PROPOSALS", proposals: parsed.proposals });
          parsed.selectedIds.forEach((id: string) => dispatch({ type: "ACCEPT_CARD", cardId: id }));
          parsed.rejectedIds.forEach((id: string) => dispatch({ type: "REJECT_CARD", cardId: id }));
          dispatch({ type: "SET_CURRENT_BATCH", batchIndex: parsed.currentBatch });
        } else {
          sessionStorage.removeItem("generation-state");
        }
      } catch {
        // Failed to restore generation state, clear it
        sessionStorage.removeItem("generation-state");
      }
    }
    // Mark as initialized after restoration attempt
    setIsInitialized(true);
  }, []);

  const value: GenerationContextValue = {
    state,
    startGeneration: (generationId: string) => dispatch({ type: "START_GENERATION", generationId }),
    setProposals: (proposals: FlashCardProposal[]) => dispatch({ type: "SET_PROPOSALS", proposals }),
    acceptCard: (cardId: string) => dispatch({ type: "ACCEPT_CARD", cardId }),
    rejectCard: (cardId: string) => dispatch({ type: "REJECT_CARD", cardId }),
    toggleSelect: (cardId: string) => dispatch({ type: "TOGGLE_SELECT", cardId }),
    editCard: (cardId: string, front: string, back: string) => dispatch({ type: "EDIT_CARD", cardId, front, back }),
    acceptAllBatch: () => dispatch({ type: "ACCEPT_ALL_BATCH", batchIndex: state.currentBatch }),
    rejectAllBatch: () => dispatch({ type: "REJECT_ALL_BATCH", batchIndex: state.currentBatch }),
    undo: () => dispatch({ type: "UNDO" }),
    setCurrentBatch: (batchIndex: number) => dispatch({ type: "SET_CURRENT_BATCH", batchIndex }),
    setStatus: (status: GenerationState["status"]) => dispatch({ type: "SET_STATUS", status }),
    setError: (error: string | null) => dispatch({ type: "SET_ERROR", error }),
    reset: () => dispatch({ type: "RESET" }),
  };

  return <GenerationContext.Provider value={value}>{children}</GenerationContext.Provider>;
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    // Provide more helpful error message with debugging info
    const errorMessage =
      "useGeneration must be used within a GenerationProvider. " +
      "Make sure to wrap your component with <GenerationProvider> or use <GenerationApp> instead of <GeneratePage> directly.";

    // In development, provide more context
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Current component tree:", {
        location: window.location?.href,
        userAgent: navigator.userAgent,
      });
    }

    throw new Error(errorMessage);
  }
  return context;
}
