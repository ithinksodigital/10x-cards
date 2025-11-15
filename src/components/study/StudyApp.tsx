// src/components/study/StudyApp.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useStudyApi } from "@/hooks/useStudyApi";
import { StudySession } from "./StudySession";
import { SessionSummary } from "./SessionSummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Play, ArrowLeft } from "lucide-react";
import type { StartSessionResponseDto, SubmitReviewCommand, SessionSummaryDto } from "@/types";

interface StudyAppProps {
  setId?: string;
}

interface SetInfo {
  id: string;
  name: string;
  cards_count: number;
}

type StudyState = "loading" | "start" | "session" | "summary" | "error";

export function StudyApp({ setId }: StudyAppProps) {
  const { startSession, submitReview, getSessionSummary, isLoading, error } = useStudyApi();
  
  const [state, setState] = useState<StudyState>("loading");
  const [setInfo, setSetInfo] = useState<SetInfo | null>(null);
  const [session, setSession] = useState<StartSessionResponseDto | null>(null);
  const [summary, setSummary] = useState<SessionSummaryDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load set info if setId is provided
  useEffect(() => {
    if (setId) {
      loadSetInfo();
    } else {
      // This should not happen as Astro page redirects, but just in case
      setState("error");
      setErrorMessage("Brak identyfikatora zestawu. Przekierowywanie...");
      setTimeout(() => {
        window.location.href = "/sets";
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const loadSetInfo = useCallback(async () => {
    if (!setId) {
      setState("start");
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(setId)) {
      setErrorMessage("Nieprawidłowy identyfikator zestawu");
      setState("error");
      return;
    }

    try {
      setState("loading");
      setErrorMessage(null);
      const response = await fetch(`/api/sets/${setId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          throw new Error("Zestaw nie został znaleziony. Upewnij się, że zestaw istnieje i należy do Ciebie.");
        }
        if (response.status === 401) {
          throw new Error("Brak autoryzacji. Zaloguj się, aby kontynuować.");
        }
        throw new Error(errorData.message || "Nie udało się załadować zestawu");
      }

      const data = await response.json();
      setSetInfo({
        id: data.id,
        name: data.name,
        cards_count: data.cards_count,
      });
      setState("start");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Wystąpił błąd podczas ładowania zestawu";
      setErrorMessage(errorMsg);
      setState("error");
    }
  }, [setId]);

  const handleStartSession = useCallback(async () => {
    if (!setId) return;

    try {
      setErrorMessage(null);
      const response = await startSession({
        set_id: setId,
        new_cards_limit: 20,
        review_cards_limit: 100,
      });
      
      setSession(response);
      setState("session");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Nie udało się rozpocząć sesji";
      setErrorMessage(errorMsg);
      setState("error");
    }
  }, [setId, startSession]);

  const handleReview = useCallback(
    async (command: SubmitReviewCommand) => {
      try {
        await submitReview(command);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Nie udało się zapisać oceny";
        setErrorMessage(errorMsg);
        throw err; // Re-throw to let StudySession handle it
      }
    },
    [submitReview]
  );

  const handleSessionComplete = useCallback(async () => {
    if (!session) return;

    try {
      const sessionSummary = await getSessionSummary(session.session_id);
      setSummary(sessionSummary);
      setState("summary");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Nie udało się pobrać podsumowania";
      setErrorMessage(errorMsg);
      setState("error");
    }
  }, [session, getSessionSummary]);

  const handleStudyMore = useCallback(() => {
    setState("start");
    setSession(null);
    setSummary(null);
  }, []);

  const handleBackToSets = useCallback(() => {
    window.location.href = "/sets";
  }, []);

  const handleCloseSession = useCallback(() => {
    if (confirm("Czy na pewno chcesz zamknąć sesję? Postęp zostanie zapisany.")) {
      handleSessionComplete();
    }
  }, [handleSessionComplete]);

  // Loading state
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Błąd</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage || error || "Wystąpił nieoczekiwany błąd"}</AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <Button onClick={loadSetInfo} variant="outline">
                  Spróbuj ponownie
                </Button>
                <Button onClick={handleBackToSets}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Powrót do zestawów
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Session in progress
  if (state === "session" && session) {
    return (
      <StudySession
        session={session}
        onReview={handleReview}
        onComplete={handleSessionComplete}
        onClose={handleCloseSession}
      />
    );
  }

  // Session summary
  if (state === "summary" && summary) {
    return (
      <SessionSummary
        summary={summary}
        onStudyMore={handleStudyMore}
        onBackToSets={handleBackToSets}
      />
    );
  }

  // Start screen
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToSets}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do zestawów
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sesje powtórkowe</h1>
          <p className="text-muted-foreground text-lg">Systematyczne powtarzanie fiszek dla lepszego zapamiętywania</p>
        </div>

        {setInfo ? (
          <Card>
            <CardHeader>
              <CardTitle>{setInfo.name}</CardTitle>
              <p className="text-muted-foreground">
                {setInfo.cards_count} {setInfo.cards_count === 1 ? "fiszka" : "fiszek"} w zestawie
              </p>
            </CardHeader>
            <CardContent>
              {setInfo.cards_count === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ten zestaw nie zawiera jeszcze żadnych fiszek. Wygeneruj fiszki, aby rozpocząć naukę.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Rozpocznij sesję powtórkową, aby przejrzeć fiszki z tego zestawu. System automatycznie wybierze
                    karty do powtórki na podstawie algorytmu spaced repetition.
                  </p>
                  <Button
                    onClick={handleStartSession}
                    disabled={isLoading}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Rozpoczynanie...
                      </div>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Rozpocznij sesję
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Dzisiejsze powtórki</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Wybierz zestaw, aby rozpocząć sesję</p>
                <Button
                  onClick={handleBackToSets}
                  variant="outline"
                  className="w-full"
                >
                  Przejdź do zestawów
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

