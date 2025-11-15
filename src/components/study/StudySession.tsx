// src/components/study/StudySession.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X, AlertCircle } from "lucide-react";
import type { StartSessionResponseDto, SubmitReviewCommand } from "@/types";

interface StudySessionProps {
  session: StartSessionResponseDto;
  onReview: (command: SubmitReviewCommand) => Promise<void>;
  onComplete: () => void;
  onClose: () => void;
}

const RATING_LABELS = {
  1: { label: "Znowu", color: "bg-red-500 hover:bg-red-600" },
  2: { label: "Trudne", color: "bg-orange-500 hover:bg-orange-600" },
  3: { label: "Dobrze", color: "bg-yellow-500 hover:bg-yellow-600" },
  4: { label: "Łatwe", color: "bg-green-500 hover:bg-green-600" },
  5: { label: "Doskonale", color: "bg-emerald-500 hover:bg-emerald-600" },
} as const;

export function StudySession({ session, onReview, onComplete, onClose }: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // Check if session has cards
  if (!session.cards || session.cards.length === 0) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4 py-6">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Brak kart do powtórki</h3>
            <p className="text-sm text-muted-foreground">
              Wszystkie karty z tego zestawu są już przerobione lub nie ma kart do nauki w tym momencie.
            </p>
            <Button onClick={onClose} className="w-full">
              Zamknij
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentCard = session.cards[currentIndex];
  const progress = ((currentIndex + 1) / session.total_cards) * 100;
  const isLastCard = currentIndex === session.cards.length - 1;

  const handleFlip = useCallback(() => {
    if (!isSubmitting) {
      setIsFlipped(!isFlipped);
    }
  }, [isFlipped, isSubmitting]);

  const handleRating = useCallback(
    async (rating: number) => {
      if (isSubmitting || !currentCard) return;

      setIsSubmitting(true);

      try {
        await onReview({
          card_id: currentCard.id,
          rating,
          session_id: session.session_id,
        });

        // Move to next card or complete session
        if (isLastCard) {
          onComplete();
        } else {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
        }
      } catch (error) {
        console.error("Failed to submit review:", error);
        // Error is handled by parent component
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, isSubmitting, isLastCard, onReview, session.session_id]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;

      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          handleFlip();
          break;
        case "1":
          e.preventDefault();
          handleRating(1);
          break;
        case "2":
          e.preventDefault();
          handleRating(2);
          break;
        case "3":
          e.preventDefault();
          handleRating(3);
          break;
        case "4":
          e.preventDefault();
          handleRating(4);
          break;
        case "5":
          e.preventDefault();
          handleRating(5);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, isSubmitting, handleFlip, handleRating, onClose]);

  // Additional safety check (should not happen due to early return above)
  if (!currentCard) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4 py-6">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Błąd</h3>
            <p className="text-sm text-muted-foreground">Nie można załadować karty.</p>
            <Button onClick={onClose} className="w-full">
              Zamknij
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl w-full h-[90vh] p-0 flex flex-col"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header with progress and close button */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Karta {currentIndex + 1} z {session.total_cards}
                </span>
                <span className="text-sm text-muted-foreground">
                  {session.new_cards > 0 && `${session.new_cards} nowych`}
                  {session.new_cards > 0 && session.review_cards > 0 && " • "}
                  {session.review_cards > 0 && `${session.review_cards} powtórek`}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-4"
              aria-label="Zamknij sesję"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Card display area */}
        <div className="flex-1 flex items-center justify-center p-6 min-h-0">
          <Card
            className={cn(
              "w-full max-w-2xl h-full cursor-pointer transition-all duration-300",
              "hover:shadow-lg focus-within:ring-2 focus-within:ring-primary"
            )}
            onClick={handleFlip}
            tabIndex={0}
            role="button"
            aria-label={`Fiszka: ${isFlipped ? "Tył" : "Przód"}`}
          >
            <CardContent className="p-8 h-full flex flex-col justify-center">
              <div className="text-center">
                <div className="text-2xl md:text-3xl leading-relaxed break-words">
                  {isFlipped ? currentCard.back : currentCard.front}
                </div>
                {!isFlipped && (
                  <p className="mt-4 text-sm text-muted-foreground">Kliknij lub naciśnij spację, aby zobaczyć odpowiedź</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rating buttons */}
        <div className="px-6 pb-6 border-t pt-6">
          {isFlipped ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-center text-muted-foreground mb-4">
                Jak dobrze pamiętałeś tę odpowiedź?
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((rating) => {
                  const config = RATING_LABELS[rating as keyof typeof RATING_LABELS];
                  return (
                    <Button
                      key={rating}
                      onClick={() => handleRating(rating)}
                      disabled={isSubmitting}
                      className={cn(
                        "h-16 flex flex-col items-center justify-center gap-1 text-white font-medium",
                        config.color,
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <span className="text-lg font-bold">{rating}</span>
                      <span className="text-xs">{config.label}</span>
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Lub użyj klawiszy 1-5 na klawiaturze
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Odwróć kartę, aby zobaczyć odpowiedź i ocenić swoją wiedzę
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

