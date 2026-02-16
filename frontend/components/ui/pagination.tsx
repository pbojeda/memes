'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  // Don't render if only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  // Generate page numbers to display
  const generatePageNumbers = (): (number | 'ellipsis')[] => {
    // Show all pages if 7 or fewer
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // For more than 7 pages, show:
    // - First page (1)
    // - Last page (totalPages)
    // - Current page and ±1 around it
    // - Ellipsis in gaps

    const pages: (number | 'ellipsis')[] = [];
    const showPages = new Set<number>();

    // Always show first and last
    showPages.add(1);
    showPages.add(totalPages);

    // Show current page and neighbors
    showPages.add(currentPage);
    if (currentPage > 1) showPages.add(currentPage - 1);
    if (currentPage < totalPages) showPages.add(currentPage + 1);

    // Convert to sorted array
    const sortedPages = Array.from(showPages).sort((a, b) => a - b);

    // Build the final array with ellipsis
    for (let i = 0; i < sortedPages.length; i++) {
      const current = sortedPages[i];
      const prev = sortedPages[i - 1];

      // Add ellipsis if gap > 1
      if (prev !== undefined && current - prev > 1) {
        pages.push('ellipsis');
      }

      pages.push(current);
    }

    return pages;
  };

  const pages = generatePageNumbers();

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      {/* Previous button */}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className="flex items-center px-2">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }

        const isCurrentPage = page === currentPage;

        return (
          <Button
            key={page}
            variant={isCurrentPage ? 'default' : 'outline'}
            size="icon-sm"
            onClick={() => handlePageClick(page)}
            aria-current={isCurrentPage ? 'page' : undefined}
            aria-label={`Go to page ${page}`}
          >
            {page}
          </Button>
        );
      })}

      {/* Next button */}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </nav>
  );
}
