// src/lib/services/srs.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  GetDueCardsResponseDto,
  StartSessionCommand,
  StartSessionResponseDto,
  SubmitReviewCommand,
  SubmitReviewResponseDto,
  SessionSummaryDto,
} from "../../types";
import type { Enums } from "../../db/database.types";
import { NotFoundError, UnauthorizedError, DailyLimitError } from "../errors";
import { CardService } from "./card.service";

/**
 * Session state stored in memory (could be moved to Redis for production)
 */
interface SessionState {
  session_id: string;
  user_id: string;
  set_id: string;
  cards: string[]; // Card IDs
  started_at: string;
  completed_at?: string;
  new_cards: number;
  review_cards: number;
  reviews: {
    card_id: string;
    rating: number;
    reviewed_at: string;
  }[];
}

/**
 * Daily progress tracking (could be moved to Redis or database)
 */
interface DailyProgress {
  user_id: string;
  date: string;
  new_cards_today: number;
  reviews_today: number;
}

/**
 * Service for SRS (Spaced Repetition System) functionality
 */
export class SrsService {
  // In-memory session storage (use Redis in production)
  private static sessions = new Map<string, SessionState>();
  private static dailyProgress = new Map<string, DailyProgress>();

  constructor(
    private supabase: SupabaseClient,
    private cardService: CardService
  ) {
    // Constructor intentionally empty
  }

  /**
   * Get cards due for review today
   */
  async getDueCards(userId: string, setId?: string): Promise<GetDueCardsResponseDto> {
    const now = new Date().toISOString();

    // Build base query
    let baseQuery = this.supabase.from("cards").select("id, set_id, front, back, status, due_at").eq("user_id", userId);

    if (setId) {
      baseQuery = baseQuery.eq("set_id", setId);
    }

    // Count new cards
    let newQuery = this.supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "new");

    if (setId) {
      newQuery = newQuery.eq("set_id", setId);
    }

    const { count: newCount } = await newQuery;

    // Count review cards (due today)
    let reviewQuery = this.supabase
      .from("cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "new")
      .lte("due_at", now);

    if (setId) {
      reviewQuery = reviewQuery.eq("set_id", setId);
    }

    const { count: reviewCount } = await reviewQuery;

    // Get daily progress
    const dailyProgress = this.getDailyProgress(userId);

    const limits = {
      new_cards: 20,
      reviews: 100,
      new_cards_remaining: Math.max(0, 20 - dailyProgress.new_cards_today),
      reviews_remaining: Math.max(0, 100 - dailyProgress.reviews_today),
    };

    // Fetch due cards with limits applied
    const cardsLimit = Math.max(limits.new_cards_remaining, limits.reviews_remaining);

    const { data: cards } = await baseQuery
      .or(`status.eq.new,and(status.neq.new,due_at.lte.${now})`)
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(cardsLimit);

    return {
      new_cards_available: newCount ?? 0,
      review_cards_available: reviewCount ?? 0,
      daily_limits: limits,
      cards: cards ?? [],
    };
  }

  /**
   * Start a new SRS session
   * @throws {NotFoundError} If set not found
   * @throws {DailyLimitError} If daily limit reached
   */
  async startSession(command: StartSessionCommand, userId: string): Promise<StartSessionResponseDto> {
    // 1. Verify set ownership
    const { data: set, error: setError } = await this.supabase
      .from("sets")
      .select("id, user_id")
      .eq("id", command.set_id)
      .eq("user_id", userId)
      .single();

    if (setError || !set) {
      throw new NotFoundError("Set");
    }

    // 2. Get daily progress
    const dailyProgress = this.getDailyProgress(userId);

    // 3. Check daily limits
    const newCardsRemaining = 20 - dailyProgress.new_cards_today;
    const reviewsRemaining = 100 - dailyProgress.reviews_today;

    if (newCardsRemaining <= 0 && reviewsRemaining <= 0) {
      throw new DailyLimitError("You have reached your daily limits for both new cards and reviews", {
        new_cards_today: dailyProgress.new_cards_today,
        new_cards_limit: 20,
        reviews_today: dailyProgress.reviews_today,
        reviews_limit: 100,
      });
    }

    // 4. Fetch new cards
    const { data: newCards } = await this.supabase
      .from("cards")
      .select("id, front, back, status")
      .eq("set_id", command.set_id)
      .eq("user_id", userId)
      .eq("status", "new")
      .order("created_at", { ascending: true })
      .limit(Math.min(command.new_cards_limit, newCardsRemaining));

    // 5. Fetch review cards
    const now = new Date().toISOString();
    const { data: reviewCards } = await this.supabase
      .from("cards")
      .select("id, front, back, status")
      .eq("set_id", command.set_id)
      .eq("user_id", userId)
      .neq("status", "new")
      .lte("due_at", now)
      .order("due_at", { ascending: true })
      .limit(Math.min(command.review_cards_limit, reviewsRemaining));

    // 6. Combine cards
    const allCards = [...(newCards ?? []), ...(reviewCards ?? [])];

    // 7. Create session
    const sessionId = crypto.randomUUID();
    const sessionState: SessionState = {
      session_id: sessionId,
      user_id: userId,
      set_id: command.set_id,
      cards: allCards.map((c) => c.id),
      started_at: new Date().toISOString(),
      new_cards: newCards?.length ?? 0,
      review_cards: reviewCards?.length ?? 0,
      reviews: [],
    };

    SrsService.sessions.set(sessionId, sessionState);

    return {
      session_id: sessionId,
      cards: allCards,
      total_cards: allCards.length,
      new_cards: newCards?.length ?? 0,
      review_cards: reviewCards?.length ?? 0,
    };
  }

  /**
   * Submit a card review with rating
   * Implements SM-2 algorithm
   * @throws {UnauthorizedError} If session doesn't belong to user
   * @throws {NotFoundError} If card or session not found
   */
  async submitReview(command: SubmitReviewCommand, userId: string): Promise<SubmitReviewResponseDto> {
    // 1. Verify session
    const session = SrsService.sessions.get(command.session_id);
    if (!session) {
      throw new NotFoundError("Session");
    }

    if (session.user_id !== userId) {
      throw new UnauthorizedError("Session does not belong to user");
    }

    // 2. Get current card
    const card = await this.cardService.getCard(command.card_id, userId);

    // 3. Calculate new SRS values using SM-2
    const sm2Result = this.calculateSM2(
      card.interval_days,
      card.ease_factor,
      card.repetitions,
      card.status,
      command.rating
    );

    // 4. Update card
    const { data: updatedCard, error } = await this.supabase
      .from("cards")
      .update({
        interval_days: sm2Result.interval_days,
        ease_factor: sm2Result.ease_factor,
        repetitions: sm2Result.repetitions,
        status: sm2Result.status,
        due_at: sm2Result.due_at,
      })
      .eq("id", command.card_id)
      .eq("user_id", userId)
      .select("id, interval_days, ease_factor, repetitions, status, due_at")
      .single();

    if (error || !updatedCard) {
      throw new Error("Failed to update card");
    }

    // 5. Record review in session
    session.reviews.push({
      card_id: command.card_id,
      rating: command.rating,
      reviewed_at: new Date().toISOString(),
    });

    // 6. Update daily progress
    if (card.status === "new") {
      this.incrementDailyProgress(userId, "new_cards");
    } else {
      this.incrementDailyProgress(userId, "reviews");
    }

    return {
      card_id: updatedCard.id,
      next_review_at: updatedCard.due_at ?? "",
      interval_days: updatedCard.interval_days,
      ease_factor: updatedCard.ease_factor,
      repetitions: updatedCard.repetitions,
      status: updatedCard.status,
    };
  }

  /**
   * Get session summary (active or completed)
   * @throws {NotFoundError} If session not found
   * @throws {UnauthorizedError} If session doesn't belong to user
   */
  async getSessionSummary(sessionId: string, userId: string): Promise<SessionSummaryDto> {
    // Get session state
    const session = SrsService.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundError("Session");
    }

    if (session.user_id !== userId) {
      throw new UnauthorizedError("Session does not belong to user");
    }

    // Calculate stats
    const reviews = session.reviews;
    const ratingsDistribution = reviews.reduce(
      (acc, review) => {
        const key = review.rating.toString();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    const completedAt = session.completed_at ?? new Date().toISOString();
    const timeSpentSeconds = Math.floor(
      (new Date(completedAt).getTime() - new Date(session.started_at).getTime()) / 1000
    );

    return {
      session_id: sessionId,
      started_at: session.started_at,
      completed_at: completedAt,
      total_cards: session.cards.length,
      cards_reviewed: reviews.length,
      average_rating: Number(averageRating.toFixed(2)),
      ratings_distribution: ratingsDistribution,
      time_spent_seconds: timeSpentSeconds,
    };
  }

  /**
   * SM-2 Algorithm Implementation
   * Based on SuperMemo SM-2 algorithm
   */
  private calculateSM2(
    currentInterval: number,
    currentEaseFactor: number,
    currentRepetitions: number,
    currentStatus: Enums<"card_status">,
    rating: number
  ): {
    interval_days: number;
    ease_factor: number;
    repetitions: number;
    status: Enums<"card_status">;
    due_at: string;
  } {
    let interval = currentInterval;
    let easeFactor = currentEaseFactor;
    let repetitions = currentRepetitions;
    let status: Enums<"card_status"> = currentStatus;

    // Rating < 3: Failed (Again, Hard)
    if (rating < 3) {
      interval = 0;
      repetitions = 0;
      status = currentStatus === "new" ? "learning" : "relearning";
    } else {
      // Rating >= 3: Success (Good, Easy)
      repetitions += 1;

      if (repetitions === 1) {
        interval = 1; // 1 day
        status = "learning";
      } else if (repetitions === 2) {
        interval = 6; // 6 days
        status = "review";
      } else {
        interval = Math.round(interval * easeFactor);
        status = "review";
      }

      // Update ease factor based on rating
      // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
      easeFactor = Math.max(1.3, easeFactor); // Minimum ease factor is 1.3
    }

    // Calculate due_at
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + interval);
    const due_at = dueDate.toISOString();

    return {
      interval_days: interval,
      ease_factor: Number(easeFactor.toFixed(2)),
      repetitions,
      status,
      due_at,
    };
  }

  /**
   * Get daily progress for a user
   */
  private getDailyProgress(userId: string): DailyProgress {
    const today = new Date().toISOString().split("T")[0];
    const key = `${userId}-${today}`;

    let progress = SrsService.dailyProgress.get(key);

    // Initialize if not exists or date changed
    if (!progress || progress.date !== today) {
      progress = {
        user_id: userId,
        date: today,
        new_cards_today: 0,
        reviews_today: 0,
      };
      SrsService.dailyProgress.set(key, progress);
    }

    return progress;
  }

  /**
   * Increment daily progress counter
   */
  private incrementDailyProgress(userId: string, type: "new_cards" | "reviews"): void {
    const progress = this.getDailyProgress(userId);

    if (type === "new_cards") {
      progress.new_cards_today += 1;
    } else {
      progress.reviews_today += 1;
    }
  }

  /**
   * Mark session as completed
   */
  completeSession(sessionId: string, userId: string): void {
    const session = SrsService.sessions.get(sessionId);
    if (session && session.user_id === userId) {
      session.completed_at = new Date().toISOString();
    }
  }

  /**
   * Clear expired sessions (cleanup utility)
   * Call this periodically to prevent memory leaks
   */
  static clearExpiredSessions(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of SrsService.sessions.entries()) {
      const sessionTime = new Date(session.started_at).getTime();
      if (now.getTime() - sessionTime > maxAge) {
        SrsService.sessions.delete(sessionId);
      }
    }
  }
}
