import React from 'react';
import { Search, RefreshCw, X, Filter } from 'lucide-react';

interface ControlsProps {
  category: string;
  onCategoryChange: (cat: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  category,
  onCategoryChange,
  status,
  onStatusChange,
  searchQuery,
  onSearchChange,
  isLoading,
  onRefresh,
}) => {
  const hasFilters = Boolean(category || status || searchQuery);

  const handleClearFilters = () => {
    onCategoryChange('');
    onStatusChange('');
    onSearchChange('');
  };

  return (
    <div
      id="events-controls-panel"
      className="border-b border-[#33301f] bg-[#1e1b15] px-6 py-4 md:px-8"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search input - corresponds to .controls input[type="text"] in the user's stylesheet */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9b9583]" />
          <input
            id="event-search-input"
            type="text"
            placeholder="Search events, venues, or performers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-md border border-[#33301f] bg-[#16140f] py-2 pl-9 pr-8 text-sm text-[#f0ece0] placeholder-[#9b9583] outline-none transition-colors focus:border-[#e0a72e]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9b9583] hover:text-[#f0ece0]"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category select */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="category-select"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="rounded-md border border-[#33301f] bg-[#16140f] px-3 py-2 text-sm text-[#f0ece0] outline-none transition-colors focus:border-[#e0a72e]"
          >
            <option value="">All categories</option>
            <option value="concert">Concert</option>
            <option value="comedy">Comedy</option>
            <option value="meetup">Meetup</option>
            <option value="market">Market</option>
          </select>

          {/* Status select */}
          <select
            id="status-select"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-md border border-[#33301f] bg-[#16140f] px-3 py-2 text-sm text-[#f0ece0] outline-none transition-colors focus:border-[#e0a72e]"
          >
            <option value="">All statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Refresh button */}
          <button
            id="loadBtn"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-md bg-[#e0a72e] px-4 py-2 text-sm font-semibold text-[#16140f] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>

          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-xs text-[#9b9583] hover:text-[#f0ece0] px-2 py-1"
              title="Reset all filters"
            >
              <X className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
