import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationDto } from "@/types";

interface PaginationProps {
  pagination: PaginationDto;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ pagination, onPageChange, className }: PaginationProps) {
  const { page, total_pages, total } = pagination;

  // Don't render if there's only one page or no items
  if (total_pages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < total_pages) {
      onPageChange(page + 1);
    }
  };

  const handlePageClick = (pageNumber: number) => {
    onPageChange(pageNumber);
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (total_pages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(total_pages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < total_pages - 2) {
        pages.push("...");
      }

      // Always show last page
      if (total_pages > 1) {
        pages.push(total_pages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="text-sm text-muted-foreground">
        Pokazuję {(page - 1) * pagination.limit + 1}-{Math.min(page * pagination.limit, total)} z {total} zestawów
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={page === 1}
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((pageNumber, index) => (
          <React.Fragment key={index}>
            {pageNumber === "..." ? (
              <span className="px-2 text-muted-foreground">...</span>
            ) : (
              <Button
                variant={pageNumber === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageClick(pageNumber as number)}
                aria-label={`Strona ${pageNumber}`}
                aria-current={pageNumber === page ? "page" : undefined}
                className="min-w-[2.5rem]"
              >
                {pageNumber}
              </Button>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={page === total_pages}
          aria-label="Następna strona"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
