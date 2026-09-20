import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onLimitChange?: (newLimit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  total,
  limit,
  offset,
  hasMore,
  isLoading,
  onPrev,
  onNext,
  onLimitChange,
}) => {
  if (total === 0) return null;

  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, total);
  const isFirstPage = offset === 0;
  const isLastPage = !hasMore || end >= total;

  return (
    <div
      id="pager"
      className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#33301f] pt-5 text-sm text-[#9b9583]"
    >
      <div className="flex items-center gap-3">
        <span id="pagerLabel" className="font-medium text-[#f0ece0]">
          {start}–{end} <span className="text-[#9b9583]">of</span> {total}{' '}
          <span className="text-[#9b9583]">events</span>
        </span>

        {onLimitChange && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              disabled={isLoading}
              className="rounded border border-[#33301f] bg-[#1e1b15] px-2 py-1 text-xs text-[#f0ece0] outline-none focus:border-[#e0a72e]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          id="prevBtn"
          onClick={onPrev}
          disabled={isFirstPage || isLoading}
          className="flex items-center gap-1 rounded-md border border-[#33301f] bg-[#1e1b15] px-3.5 py-1.5 text-xs font-medium text-[#f0ece0] transition-colors hover:border-[#e0a72e] hover:text-[#e0a72e] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[#33301f] disabled:hover:text-[#f0ece0]"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>

        <button
          id="nextBtn"
          onClick={onNext}
          disabled={isLastPage || isLoading}
          className="flex items-center gap-1 rounded-md border border-[#33301f] bg-[#1e1b15] px-3.5 py-1.5 text-xs font-medium text-[#f0ece0] transition-colors hover:border-[#e0a72e] hover:text-[#e0a72e] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[#33301f] disabled:hover:text-[#f0ece0]"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
