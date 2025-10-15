import React, { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Loader2Icon, DatabaseIcon, CheckIcon, XIcon } from "lucide-react";

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  anonymousData: {
    sessionId: string;
    generatedCards: {
      id: string;
      front: string;
      back: string;
      language: string;
      isAccepted: boolean;
      isEdited: boolean;
    }[];
    reviewState: {
      currentBatch: number;
      totalBatches: number;
      acceptedCards: string[];
      rejectedCards: string[];
    };
    createdAt: string;
    expiresAt: string;
  };
  existingSets?: {
    id: string;
    name: string;
    language: string;
    card_count: number;
  }[];
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  anonymousData,
  existingSets = [],
}) => {
  const { migrateAnonymousData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [migrationType, setMigrationType] = useState<"existing" | "new">("existing");
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [newSetName, setNewSetName] = useState<string>("");
  const [migrationComplete, setMigrationComplete] = useState(false);

  const acceptedCards = anonymousData.generatedCards.filter((card) => card.isAccepted);
  const rejectedCards = anonymousData.generatedCards.filter((card) => !card.isAccepted);

  const handleMigration = async () => {
    setIsLoading(true);
    setError("");

    try {
      const migrationData = {
        anonymousData,
        ...(migrationType === "existing" ? { targetSetId: selectedSetId } : { newSetName }),
      };

      await migrateAnonymousData(migrationData);
      setMigrationComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas migracji");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (migrationComplete) {
      // Clear anonymous data after successful migration
      localStorage.removeItem("anonymous_session");
      sessionStorage.clear();
    }
    onClose();
  };

  if (migrationComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Migracja zakończona!</DialogTitle>
            <DialogDescription className="text-center">
              Twoje dane zostały pomyślnie przeniesione do konta
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Przeniesiono <strong>{acceptedCards.length}</strong> fiszek
              </p>
              <p className="text-xs text-muted-foreground">Dane anonimowe zostały usunięte z przeglądarki</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Kontynuuj
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5" />
            Przenieś dane do konta
          </DialogTitle>
          <DialogDescription>
            Masz niezapisane fiszki z sesji anonimowej. Wybierz, gdzie chcesz je zapisać.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Podsumowanie danych</CardTitle>
              <CardDescription>Dane z sesji anonimowej do przeniesienia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Zaakceptowane:</span>
                  <Badge variant="secondary">{acceptedCards.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <XIcon className="w-4 h-4 text-red-600" />
                  <span className="text-sm">Odrzucone:</span>
                  <Badge variant="outline">{rejectedCards.length}</Badge>
                </div>
              </div>

              {acceptedCards.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Przykładowe fiszki:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {acceptedCards.slice(0, 3).map((card) => (
                      <div key={card.id} className="text-xs p-2 bg-muted rounded">
                        <div className="font-medium truncate">{card.front}</div>
                        <div className="text-muted-foreground truncate">{card.back}</div>
                      </div>
                    ))}
                    {acceptedCards.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        ... i {acceptedCards.length - 3} więcej
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Migration options */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Wybierz opcję:</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={migrationType === "existing" ? "default" : "outline"}
                  onClick={() => setMigrationType("existing")}
                  disabled={isLoading || existingSets.length === 0}
                  className="justify-start"
                >
                  Istniejący zestaw
                </Button>
                <Button
                  variant={migrationType === "new" ? "default" : "outline"}
                  onClick={() => setMigrationType("new")}
                  disabled={isLoading}
                  className="justify-start"
                >
                  Nowy zestaw
                </Button>
              </div>
            </div>

            {migrationType === "existing" && existingSets.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="set-select" className="text-sm font-medium">Wybierz zestaw:</label>
                <select
                  id="set-select"
                  value={selectedSetId}
                  onChange={(e) => setSelectedSetId(e.target.value)}
                  disabled={isLoading}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="">-- Wybierz zestaw --</option>
                  {existingSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.name} ({set.language}) - {set.card_count} fiszek
                    </option>
                  ))}
                </select>
              </div>
            )}

            {migrationType === "new" && (
              <div className="space-y-2">
                <label htmlFor="new-set-name" className="text-sm font-medium">Nazwa nowego zestawu:</label>
                <Input
                  id="new-set-name"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="np. Moje fiszki z sesji"
                  disabled={isLoading}
                />
              </div>
            )}

            {existingSets.length === 0 && migrationType === "existing" && (
              <Alert>
                <AlertDescription>
                  Nie masz jeszcze żadnych zestawów. Utwórz nowy zestaw, aby zapisać fiszki.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button
              onClick={handleMigration}
              disabled={
                isLoading ||
                (migrationType === "existing" && !selectedSetId) ||
                (migrationType === "new" && !newSetName.trim()) ||
                acceptedCards.length === 0
              }
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Przenoszenie...
                </>
              ) : (
                "Przenieś dane"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
