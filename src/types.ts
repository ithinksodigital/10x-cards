// src/types.ts
import { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// Common
export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
export interface ErrorResponseDto {
  error: string;
  message?: string;
  details?: Record<string, string>;
  code?: string;
  timestamp: string;
}

// Sets
export type SetDto = Pick<
  Tables<"sets">,
  "id" | "user_id" | "name" | "language" | "cards_count" | "created_at" | "updated_at"
>;
export type CreateSetCommand = Pick<TablesInsert<"sets">, "name" | "language">;
export type UpdateSetCommand = Pick<TablesUpdate<"sets">, "name">;
export interface DeleteSetResponseDto {
  message: string;
}

// Cards
export type CardDto = Pick<
  Tables<"cards">,
  | "id"
  | "set_id"
  | "user_id"
  | "front"
  | "back"
  | "language"
  | "due_at"
  | "interval_days"
  | "ease_factor"
  | "repetitions"
  | "status"
  | "generation_id"
  | "source_text_excerpt"
  | "ai_confidence_score"
  | "was_edited_after_generation"
  | "created_at"
  | "updated_at"
>;
export type CardDetailDto = CardDto & Pick<Tables<"cards">, "original_front" | "original_back">;
export type CreateCardCommand = Pick<TablesInsert<"cards">, "front" | "back">;
export type BatchCreateCardItemCommand = Pick<
  TablesInsert<"cards">,
  "front" | "back" | "source_text_excerpt" | "ai_confidence_score" | "original_front" | "original_back"
> & { was_edited: boolean };
export interface BatchCreateCardsCommand {
  generation_id: string;
  cards: BatchCreateCardItemCommand[];
}
export interface BatchCreateCardsResponseDto {
  created: number;
  cards: CardDto[];
  generation_updated: boolean;
}
export type UpdateCardCommand = Partial<Pick<TablesUpdate<"cards">, "front" | "back">>;
export type UpdateCardResponseDto = Pick<
  Tables<"cards">,
  | "id"
  | "set_id"
  | "user_id"
  | "front"
  | "back"
  | "language"
  | "was_edited_after_generation"
  | "original_front"
  | "original_back"
  | "updated_at"
>;
export interface DeleteCardResponseDto {
  message: string;
}

// Generations
export type GenerationStatus = "processing" | "completed" | "failed";
export interface StartGenerationCommand {
  source_text: string;
  language?: string; // ISO code: pl, en, es
  target_count?: number; // 1-30
}
export type StartGenerationResponseDto = Pick<
  Tables<"generations">,
  "id" | "user_id" | "model" | "source_text_hash" | "source_text_length" | "created_at"
> & { status: "processing"; estimated_duration_ms: number };
export interface ProcessingGenerationDto {
  id: string;
  status: "processing";
  progress: number;
  message: string;
}
export type CompletedGenerationDto = Pick<
  Tables<"generations">,
  | "id"
  | "user_id"
  | "model"
  | "source_text"
  | "source_text_hash"
  | "source_text_length"
  | "generated_count"
  | "generation_duration_ms"
  | "prompt_tokens"
  | "completion_tokens"
  | "total_cost_usd"
  | "created_at"
  | "updated_at"
> & {
  status: "completed";
  completed_at: string;
  cards: { front: string; back: string; source_text_excerpt: string; ai_confidence_score: number }[];
};
export interface FailedGenerationDto {
  id: string;
  status: "failed";
  error: { code: string; message: string; retry_count: number };
}
export interface RetryGenerationResponseDto {
  id: string;
  status: string;
  message: string;
}
export type GenerationListItemDto = Pick<
  Tables<"generations">,
  "id" | "model" | "source_text_length" | "generated_count" | "accepted_count" | "created_at"
> & { status: GenerationStatus };
export interface ListGenerationsResponseDto {
  data: GenerationListItemDto[];
  pagination: PaginationDto;
}

// SRS Sessions
export type DueCardDto = Pick<Tables<"cards">, "id" | "set_id" | "front" | "back" | "status" | "due_at">;
export interface GetDueCardsResponseDto {
  new_cards_available: number;
  review_cards_available: number;
  daily_limits: { new_cards: number; reviews: number; new_cards_remaining: number; reviews_remaining: number };
  cards: DueCardDto[];
}
export interface StartSessionCommand {
  set_id: string;
  new_cards_limit: number;
  review_cards_limit: number;
}
export interface StartSessionResponseDto {
  session_id: string;
  cards: { id: string; front: string; back: string; status: Enums<"card_status"> }[];
  total_cards: number;
  new_cards: number;
  review_cards: number;
}
export interface SubmitReviewCommand {
  card_id: string;
  rating: number;
  session_id: string;
}
export interface SubmitReviewResponseDto {
  card_id: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  status: Enums<"card_status">;
}
export interface SessionSummaryDto {
  session_id: string;
  started_at: string;
  completed_at: string;
  total_cards: number;
  cards_reviewed: number;
  average_rating: number;
  ratings_distribution: Record<string, number>;
  time_spent_seconds: number;
}

// Data Export (GDPR)
export type CardExportDto = Pick<Tables<"cards">, "id" | "front" | "back" | "created_at">;
export type SetExportDto = Pick<Tables<"sets">, "id" | "name" | "language"> & { cards: CardExportDto[] };
export type ProfileExportDto = Pick<Tables<"profiles">, "id" | "cards_count" | "created_at">;
export type GenerationExportDto = Pick<
  Tables<"generations">,
  "id" | "model" | "generated_count" | "accepted_count" | "created_at"
>;
export interface ExportDataDto {
  profile: ProfileExportDto;
  sets: SetExportDto[];
  generations: GenerationExportDto[];
  export_date: string;
  export_version: string;
}
