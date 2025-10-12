// src/lib/view-models.ts
// ViewModels for frontend state management

/**
 * FlashCard proposal from generation - frontend representation
 */
export interface FlashCardProposal {
  id: string; // local id for frontend tracking
  front: string;
  back: string;
  source_text_excerpt?: string;
  ai_confidence_score?: number;
  was_edited: boolean;
  normalized_front?: string; // for duplicate detection
  original_front?: string | null;
  original_back?: string | null;
}

/**
 * Edit state for a card
 */
export interface CardEditState {
  front: string;
  back: string;
  valid: boolean;
  errors?: Record<string, string>;
}

/**
 * Undo action types
 */
export type UndoAction = 
  | { type: 'accept'; cardId: string }
  | { type: 'reject'; cardId: string }
  | { type: 'edit'; cardId: string; previousState: { front: string; back: string } };

/**
 * Generation flow state
 */
export interface GenerationState {
  generationId: string | null;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  proposals: FlashCardProposal[];
  selectedIds: Set<string>;
  rejectedIds: Set<string>;
  edits: Record<string, CardEditState>;
  currentBatch: number; // 0-based index
  undoStack: UndoAction[];
  error: string | null;
}

/**
 * Paste form state
 */
export interface PasteFormState {
  source_text: string;
  language?: 'pl' | 'en' | 'es';
  target_count: number;
  charCount: number;
  isValid: boolean;
  errors?: Record<string, string>;
}

