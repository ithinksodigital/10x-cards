// src/lib/services/card.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CardDto,
  CardDetailDto,
  CreateCardCommand,
  UpdateCardCommand,
  UpdateCardResponseDto,
  BatchCreateCardsCommand,
  BatchCreateCardsResponseDto,
  PaginationDto,
} from "../../types";
import { NotFoundError, DuplicateCardError, LimitExceededError } from "../errors";

/**
 * Query parameters for listing cards
 */
export interface ListCardsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "new" | "learning" | "review" | "relearning";
  sort?: "created_at" | "due_at";
  order?: "asc" | "desc";
}

/**
 * Service for managing flashcards
 */
export class CardService {
  constructor(private supabase: SupabaseClient) {
    // Constructor intentionally empty
  }

  /**
   * List cards in a set with pagination and filtering
   */
  async listCards(
    setId: string,
    userId: string,
    query: ListCardsQuery
  ): Promise<{ data: CardDto[]; pagination: PaginationDto }> {
    const { page = 1, limit = 50, search, status, sort = "created_at", order = "desc" } = query;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build base query
    let baseQuery = this.supabase
      .from("cards")
      .select(
        "id, set_id, user_id, front, back, language, due_at, interval_days, ease_factor, repetitions, status, generation_id, source_text_excerpt, ai_confidence_score, was_edited_after_generation, created_at, updated_at",
        { count: "exact" }
      )
      .eq("set_id", setId)
      .eq("user_id", userId);

    // Apply status filter if provided
    if (status) {
      baseQuery = baseQuery.eq("status", status);
    }

    // Apply search filter if provided (search in front and back)
    if (search) {
      baseQuery = baseQuery.or(`front.ilike.%${search}%,back.ilike.%${search}%`);
    }

    // Apply sorting
    baseQuery = baseQuery.order(sort, { ascending: order === "asc" });

    // Apply pagination
    baseQuery = baseQuery.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await baseQuery;

    if (error) {
      throw error;
    }

    // Calculate pagination metadata
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data ?? [],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Get a single card by ID with full details including original values
   * @throws {NotFoundError} If card not found or doesn't belong to user
   */
  async getCard(cardId: string, userId: string): Promise<CardDetailDto> {
    const { data, error } = await this.supabase
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new NotFoundError("Card");
    }

    return data;
  }

  /**
   * Create a new card manually
   * @throws {NotFoundError} If set not found
   * @throws {LimitExceededError} If set or user limit exceeded
   * @throws {DuplicateCardError} If card with same front text exists
   */
  async createCard(setId: string, command: CreateCardCommand, userId: string): Promise<CardDto> {
    // 1. Get set and verify ownership
    const { data: set, error: setError } = await this.supabase
      .from("sets")
      .select("id, user_id, language, cards_count")
      .eq("id", setId)
      .eq("user_id", userId)
      .single();

    if (setError || !set) {
      throw new NotFoundError("Set");
    }

    // 2. Check set limit (200 cards/set)
    if (set.cards_count >= 200) {
      throw new LimitExceededError("Set has reached maximum of 200 cards", {
        set_limit: 200,
        current_count: set.cards_count,
      });
    }

    // 3. Get user's total cards count
    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .select("cards_count")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Failed to fetch user profile");
    }

    // 4. Check user limit (1000 cards/account)
    if (profile.cards_count >= 1000) {
      throw new LimitExceededError("User has reached maximum of 1000 cards", {
        user_limit: 1000,
        current_count: profile.cards_count,
      });
    }

    // 5. Check for duplicate (front_normalized)
    const isDuplicate = await this.checkDuplicate(setId, command.front);
    if (isDuplicate) {
      throw new DuplicateCardError();
    }

    // 6. Insert card
    const { data: card, error: insertError } = await this.supabase
      .from("cards")
      .insert({
        set_id: setId,
        user_id: userId,
        front: command.front,
        back: command.back,
        language: set.language, // Inherit from set
        // Defaults will be set by database: status='new', ease_factor=2.5, etc.
      })
      .select(
        "id, set_id, user_id, front, back, language, due_at, interval_days, ease_factor, repetitions, status, generation_id, source_text_excerpt, ai_confidence_score, was_edited_after_generation, created_at, updated_at"
      )
      .single();

    if (insertError) {
      throw insertError;
    }

    // Triggers automatically update:
    // - sets.cards_count
    // - sets.updated_at
    // - profiles.cards_count

    return card;
  }

  /**
   * Create multiple cards from AI generation
   * @throws {NotFoundError} If set or generation not found
   * @throws {LimitExceededError} If limits exceeded
   */
  async batchCreateCards(
    setId: string,
    command: BatchCreateCardsCommand,
    userId: string
  ): Promise<BatchCreateCardsResponseDto> {
    // 1. Verify generation belongs to user
    const { data: generation, error: genError } = await this.supabase
      .from("generations")
      .select("id, user_id, generated_count, accepted_count, accepted_edited_count, accepted_unedited_count")
      .eq("id", command.generation_id)
      .eq("user_id", userId)
      .single();

    if (genError || !generation) {
      throw new NotFoundError("Generation");
    }

    // 2. Get set and check limits
    const { data: set, error: setError } = await this.supabase
      .from("sets")
      .select("id, user_id, language, cards_count")
      .eq("id", setId)
      .eq("user_id", userId)
      .single();

    if (setError || !set) {
      throw new NotFoundError("Set");
    }

    const requestedCount = command.cards.length;
    const availableInSet = 200 - set.cards_count;

    if (requestedCount > availableInSet) {
      throw new LimitExceededError(
        `Cannot add ${requestedCount} cards. Set limit: 200, current: ${set.cards_count}, available: ${availableInSet}`,
        {
          requested: requestedCount,
          available_in_set: availableInSet,
          set_limit: 200,
          current_in_set: set.cards_count,
        }
      );
    }

    // 3. Check user limit
    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .select("cards_count")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Failed to fetch user profile");
    }

    const availableInAccount = 1000 - profile.cards_count;

    if (requestedCount > availableInAccount) {
      throw new LimitExceededError(
        `Cannot add ${requestedCount} cards. User limit: 1000, current: ${profile.cards_count}, available: ${availableInAccount}`,
        {
          requested: requestedCount,
          available_in_account: availableInAccount,
          user_limit: 1000,
          current_in_account: profile.cards_count,
        }
      );
    }

    // 4. Deduplicate within batch (by front text, case-insensitive)
    const uniqueCards = this.deduplicateBatch(command.cards);

    // 5. Insert cards
    const cardsToInsert = uniqueCards.map((card) => ({
      set_id: setId,
      user_id: userId,
      front: card.front,
      back: card.back,
      language: set.language,
      generation_id: command.generation_id,
      source_text_excerpt: card.source_text_excerpt,
      ai_confidence_score: card.ai_confidence_score,
      was_edited_after_generation: card.was_edited,
      original_front: card.original_front,
      original_back: card.original_back,
    }));

    const { data: insertedCards, error: insertError } = await this.supabase
      .from("cards")
      .insert(cardsToInsert)
      .select(
        "id, set_id, user_id, front, back, language, due_at, interval_days, ease_factor, repetitions, status, generation_id, source_text_excerpt, ai_confidence_score, was_edited_after_generation, created_at, updated_at"
      );

    if (insertError) {
      throw insertError;
    }

    // 6. Update generation statistics
    const editedCount = command.cards.filter((c) => c.was_edited).length;
    const uneditedCount = command.cards.length - editedCount;

    const { error: updateGenError } = await this.supabase
      .from("generations")
      .update({
        set_id: setId,
        accepted_count: generation.accepted_count + command.cards.length,
        accepted_edited_count: generation.accepted_edited_count + editedCount,
        accepted_unedited_count: generation.accepted_unedited_count + uneditedCount,
        rejected_count: generation.generated_count - (generation.accepted_count + command.cards.length),
      })
      .eq("id", command.generation_id);

    if (updateGenError) {
      // eslint-disable-next-line no-console
      console.error("Failed to update generation stats:", updateGenError);
    }

    return {
      created: insertedCards?.length ?? 0,
      cards: insertedCards ?? [],
      generation_updated: !updateGenError,
    };
  }

  /**
   * Update a card's content
   * Preserves original values on first edit after generation
   * @throws {NotFoundError} If card not found
   * @throws {DuplicateCardError} If new front text conflicts
   */
  async updateCard(cardId: string, command: UpdateCardCommand, userId: string): Promise<UpdateCardResponseDto> {
    // 1. Get current card
    const currentCard = await this.getCard(cardId, userId);

    // 2. Prepare update data
    const updateData: Record<string, unknown> = {};

    // 3. If first edit from AI generation, save originals
    if (!currentCard.was_edited_after_generation && currentCard.generation_id) {
      updateData.original_front = currentCard.front;
      updateData.original_back = currentCard.back;
      updateData.was_edited_after_generation = true;
    }

    // 4. Apply changes
    if (command.front !== undefined) {
      // Check duplicate only if front changes
      if (command.front !== currentCard.front) {
        const isDuplicate = await this.checkDuplicate(currentCard.set_id, command.front, cardId);
        if (isDuplicate) {
          throw new DuplicateCardError();
        }
      }
      updateData.front = command.front;
    }

    if (command.back !== undefined) {
      updateData.back = command.back;
    }

    // 5. Update card
    const { data: updatedCard, error } = await this.supabase
      .from("cards")
      .update(updateData)
      .eq("id", cardId)
      .eq("user_id", userId)
      .select(
        "id, set_id, user_id, front, back, language, was_edited_after_generation, original_front, original_back, updated_at"
      )
      .single();

    if (error) {
      throw error;
    }

    if (!updatedCard) {
      throw new NotFoundError("Card");
    }

    return updatedCard;
  }

  /**
   * Delete a card
   * @throws {NotFoundError} If card not found
   */
  async deleteCard(cardId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.from("cards").delete().eq("id", cardId).eq("user_id", userId);

    if (error) {
      throw error;
    }

    // Triggers automatically update:
    // - sets.cards_count
    // - sets.updated_at
    // - profiles.cards_count
  }

  /**
   * Check if card with same front text exists in set (case-insensitive)
   * @param excludeCardId Optional card ID to exclude from check (for updates)
   */
  private async checkDuplicate(setId: string, front: string, excludeCardId?: string): Promise<boolean> {
    let query = this.supabase
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("set_id", setId)
      .ilike("front", front);

    if (excludeCardId) {
      query = query.neq("id", excludeCardId);
    }

    const { count } = await query;

    return (count ?? 0) > 0;
  }

  /**
   * Remove duplicate cards from batch based on front text (case-insensitive)
   */
  private deduplicateBatch(cards: unknown[]): unknown[] {
    const seen = new Map<string, unknown>();

    for (const card of cards) {
      const cardObj = card as { front: string };
      const normalizedFront = cardObj.front.toLowerCase().trim();
      if (!seen.has(normalizedFront)) {
        seen.set(normalizedFront, card);
      }
    }

    return Array.from(seen.values());
  }
}
