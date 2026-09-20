import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number; // 1-indexed
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string; // e.g. "attendees" or "events"
  isLoading?: boolean;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  itemLabel = 'items',
  isLoading = false,
  className = '',
}) => {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#33301f] bg-[#16140f] px-4 py-3 text-xs text-[#9b9583] rounded-b-2xl ${className}`}
    >
      {/* Left: Range and total count info */}
      <div className="flex items-center gap-2">
        <span>
          Showing{' '}
          <strong className="text-[#f0ece0]">
            {startItem}-{endItem}
          </strong>{' '}
          of <strong className="text-[#e0a72e]">{totalItems.toLocaleString()}</strong> {itemLabel}
        </span>

        {/* Page size select */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-[#33301f] pl-3">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={isLoading}
              className="rounded-md border border-[#33301f] bg-[#1a1712] px-2 py-0.5 text-xs text-[#f0ece0] focus:border-[#e0a72e] focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Pagination buttons */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="First page"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#33301f] bg-[#1e1b15] text-[#d6d0c0] hover:border-[#e0a72e] hover:text-[#f0ece0] disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {/* Previous page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="Previous page"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#33301f] bg-[#1e1b15] text-[#d6d0c0] hover:border-[#e0a72e] hover:text-[#f0ece0] disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Numeric page pills */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-[#78716c]">
                  …
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p as number)}
                disabled={isLoading}
                className={`min-w-[28px] h-7 px-1.5 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-[#e0a72e] text-[#16140f] font-bold shadow-xs'
                    : 'border border-[#33301f] bg-[#1e1b15] text-[#9b9583] hover:border-[#e0a72e]/60 hover:text-[#f0ece0]'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          aria-label="Next page"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#33301f] bg-[#1e1b15] text-[#d6d0c0] hover:border-[#e0a72e] hover:text-[#f0ece0] disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || isLoading}
          aria-label="Last page"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#33301f] bg-[#1e1b15] text-[#d6d0c0] hover:border-[#e0a72e] hover:text-[#f0ece0] disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
