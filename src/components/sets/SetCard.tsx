import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SetDto } from "@/types";
import { BookOpen, Trash2, Play } from "lucide-react";

interface SetCardProps {
  set: SetDto;
  onStudy: (setId: string) => void;
  onDelete: (setId: string) => void;
}

const languageLabels: Record<string, string> = {
  pl: "Polski",
  en: "English",
  es: "Español",
};

const languageColors: Record<string, string> = {
  pl: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  en: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  es: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function SetCard({ set, onStudy, onDelete }: SetCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 dzień temu";
    if (diffDays < 7) return `${diffDays} dni temu`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} tygodni temu`;
    return date.toLocaleDateString("pl-PL");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(set.id);
  };

  const handleStudy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStudy(set.id);
  };

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">{set.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className={`text-xs ${languageColors[set.language] || "bg-gray-100 text-gray-800"}`}
              >
                {languageLabels[set.language] || set.language}
              </Badge>
            </div>
          </div>
          <CardAction>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              aria-label={`Usuń zestaw ${set.name}`}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{set.cards_count} fiszek</span>
            <span>•</span>
            <span>Ostatnia sesja: {formatDate(set.updated_at)}</span>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleStudy} className="flex-1" disabled={set.cards_count === 0}>
              <Play className="h-4 w-4 mr-1" />
              Ucz się
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
