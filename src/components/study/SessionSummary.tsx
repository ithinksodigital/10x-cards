// src/components/study/SessionSummary.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SessionSummaryDto } from "@/types";

interface SessionSummaryProps {
  summary: SessionSummaryDto;
  onStudyMore: () => void;
  onBackToSets: () => void;
}

export function SessionSummary({ summary, onStudyMore, onBackToSets }: SessionSummaryProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} min ${secs} s`;
    }
    return `${secs} s`;
  };

  const ratingsDistribution = [
    { rating: 1, label: "Znowu", color: "bg-red-500" },
    { rating: 2, label: "Trudne", color: "bg-orange-500" },
    { rating: 3, label: "Dobrze", color: "bg-yellow-500" },
    { rating: 4, label: "Łatwe", color: "bg-green-500" },
    { rating: 5, label: "Doskonale", color: "bg-emerald-500" },
  ];

  const maxCount = Math.max(...ratingsDistribution.map((r) => summary.ratings_distribution[r.rating.toString()] || 0));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-8">
          <CardHeader className="text-center pb-6">
            <div className="text-6xl mb-4">🎉</div>
            <CardTitle className="text-3xl font-bold">Świetna robota!</CardTitle>
            <p className="text-muted-foreground mt-2">Ukończyłeś sesję powtórkową</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">{summary.cards_reviewed}</div>
                <div className="text-sm text-muted-foreground mt-1">Przejrzanych kart</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {summary.average_rating.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Średnia ocena</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">{formatTime(summary.time_spent_seconds)}</div>
                <div className="text-sm text-muted-foreground mt-1">Czas sesji</div>
              </div>
            </div>

            {/* Ratings distribution */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Rozkład ocen</h3>
              <div className="space-y-2">
                {ratingsDistribution.map(({ rating, label, color }) => {
                  const count = summary.ratings_distribution[rating.toString()] || 0;
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="w-20 text-sm font-medium text-foreground">{label}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                            <div
                              className={cn("h-full transition-all duration-500 flex items-center justify-end pr-2", color)}
                              style={{ width: `${percentage}%` }}
                            >
                              {count > 0 && (
                                <span className="text-xs font-medium text-white">{count}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={onStudyMore} variant="outline" className="flex-1">
                Ucz się więcej
              </Button>
              <Button onClick={onBackToSets} className="flex-1">
                Powrót do zestawów
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

