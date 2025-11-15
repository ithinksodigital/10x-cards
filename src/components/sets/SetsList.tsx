import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SetCard } from "./SetCard";
import { SearchInput } from "./SearchInput";
import { Pagination } from "./Pagination";
import { NewSetDialog } from "./NewSetDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetsApi } from "@/hooks/useSetsApi";
import type { SetDto, CreateSetCommand, PaginationDto } from "@/types";
import { AlertCircle, RefreshCw } from "lucide-react";

interface SetsListProps {
  onSetStudy?: (setId: string) => void;
  onSetEdit?: (setId: string) => void;
  className?: string;
}

interface SetsListState {
  sets: SetDto[];
  pagination: PaginationDto;
  searchQuery: string;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

export function SetsList({ onSetStudy, onSetEdit, className }: SetsListProps) {
  const { fetchSets, createSet, isLoading: apiLoading, error: apiError } = useSetsApi();

  const [state, setState] = useState<SetsListState>({
    sets: [],
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      total_pages: 0,
    },
    searchQuery: "",
    currentPage: 1,
    isLoading: false,
    error: null,
  });

  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(state.searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [state.searchQuery]);

  // Reset to first page when search changes
  useEffect(() => {
    if (debouncedSearchQuery !== state.searchQuery) {
      setState((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [debouncedSearchQuery, state.searchQuery]);

  // Fetch sets when search query or page changes
  const loadSets = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/sets?page=${state.currentPage}&limit=${state.pagination.limit}&search=${encodeURIComponent(debouncedSearchQuery)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        sets: data.data || [],
        pagination: data.pagination || prev.pagination,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [state.currentPage, state.pagination.limit, debouncedSearchQuery]);

  // Load sets on mount and when dependencies change
  useEffect(() => {
    loadSets();
  }, [loadSets]);

  const handleSearchChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  }, []);

  const handleCreateSet = useCallback(
    async (command: CreateSetCommand) => {
      try {
        await createSet(command);
        // Reload sets after creating new one
        await loadSets();
      } catch (error) {
        // Error is handled by the hook
        throw error;
      }
    },
    [createSet, loadSets]
  );

  const handleSetStudy = useCallback(
    (setId: string) => {
      if (onSetStudy) {
        onSetStudy(setId);
      } else {
        // Default behavior - navigate to study
        window.location.href = `/study?setId=${setId}`;
      }
    },
    [onSetStudy]
  );

  const handleSetEdit = useCallback(
    (setId: string) => {
      if (onSetEdit) {
        onSetEdit(setId);
      } else {
        // Default behavior - navigate to set detail
        window.location.href = `/sets/${setId}`;
      }
    },
    [onSetEdit]
  );

  const handleSetDelete = useCallback(
    async (setId: string) => {
      if (!confirm("Czy na pewno chcesz usunąć ten zestaw? Ta akcja nie może zostać cofnięta.")) {
        return;
      }

      try {
        const response = await fetch(`/api/sets/${setId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        // Reload sets after deletion
        await loadSets();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas usuwania zestawu";
        setState((prev) => ({ ...prev, error: errorMessage }));
      }
    },
    [loadSets]
  );

  const handleRetry = useCallback(() => {
    loadSets();
  }, [loadSets]);

  // Memoized filtered sets for performance
  const filteredSets = useMemo(() => {
    return state.sets;
  }, [state.sets]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-6">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-muted-foreground mb-4">
        {state.searchQuery ? (
          <>
            <p className="text-lg font-medium mb-2">Nie znaleziono zestawów</p>
            <p>Brak zestawów pasujących do wyszukiwania "{state.searchQuery}"</p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">Brak zestawów</p>
            <p>Utwórz swój pierwszy zestaw fiszek</p>
          </>
        )}
      </div>
      <NewSetDialog onCreateSet={handleCreateSet} isLoading={apiLoading} />
    </div>
  );

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Moje zestawy</h1>
          <p className="text-muted-foreground">
            Zarządzaj swoimi zestawami fiszek
            {state.pagination.total > 0 && <span> • {state.pagination.total} zestawów</span>}
          </p>
        </div>
        <NewSetDialog onCreateSet={handleCreateSet} isLoading={apiLoading} />
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchInput value={state.searchQuery} onChange={handleSearchChange} placeholder="Szukaj zestawów..." />
      </div>

      {/* Error State */}
      {state.error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{state.error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-1" />
              Spróbuj ponownie
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Content */}
      {state.isLoading ? (
        <LoadingSkeleton />
      ) : filteredSets.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Sets Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {filteredSets.map((set) => (
              <SetCard
                key={set.id}
                set={set}
                onStudy={handleSetStudy}
                onEdit={handleSetEdit}
                onDelete={handleSetDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination pagination={state.pagination} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
}
