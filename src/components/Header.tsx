import React from 'react';
import { Ticket, Users, Search, RefreshCw, ShieldCheck, ExternalLink, Calendar } from 'lucide-react';

interface HeaderProps {
  upstreamOnline: boolean | null;
  latencyMs?: number;
  activeView: 'event-roster' | 'global-lookup' | 'events-directory';
  onSelectView: (view: 'event-roster' | 'global-lookup' | 'events-directory') => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  upstreamOnline,
  latencyMs,
  activeView,
  onSelectView,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 border-b border-[#33301f] bg-[#16140f]/95 backdrop-blur-md px-4 py-4 md:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand & Concept */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#e0a72e] to-[#b45309] text-[#16140f] shadow-md shadow-[#e0a72e]/20">
            <Ticket className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-[#f0ece0] md:text-xl">
                Event Ticket Checker
              </h1>
              <span className="inline-flex items-center rounded-full border border-[#e0a72e]/40 bg-[#e0a72e]/10 px-2 py-0.5 text-[11px] font-semibold text-[#e0a72e]">
                Live Abuja API
              </span>
            </div>
            <p className="text-xs text-[#9b9583]">
              Check people who bought tickets for an event & verify guest list
            </p>
          </div>
        </div>

        {/* Navigation tabs & API connection */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-lg border border-[#33301f] bg-[#1e1b15] p-1">
            <button
              id="tab-event-roster"
              onClick={() => onSelectView('event-roster')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeView === 'event-roster'
                  ? 'bg-[#e0a72e] text-[#16140f] shadow-sm'
                  : 'text-[#9b9583] hover:text-[#f0ece0]'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Event Guest List</span>
            </button>
            <button
              id="tab-events-directory"
              onClick={() => onSelectView('events-directory')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeView === 'events-directory'
                  ? 'bg-[#e0a72e] text-[#16140f] shadow-sm'
                  : 'text-[#9b9583] hover:text-[#f0ece0]'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>All Events (173)</span>
            </button>
            <button
              id="tab-global-lookup"
              onClick={() => onSelectView('global-lookup')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeView === 'global-lookup'
                  ? 'bg-[#e0a72e] text-[#16140f] shadow-sm'
                  : 'text-[#9b9583] hover:text-[#f0ece0]'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Cross-Event Lookup</span>
            </button>
          </div>

          {/* Connection status indicator */}
          <div
            id="api-status-pill"
            className="flex items-center gap-2 rounded-lg border border-[#33301f] bg-[#1e1b15] px-3 py-1.5 text-xs font-medium text-[#f0ece0]"
            title="Connected to https://events-api-a9et.onrender.com/api/v1 via backend proxy"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                upstreamOnline === true
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : upstreamOnline === false
                    ? 'bg-[#e0623a]'
                    : 'animate-pulse bg-[#e0a72e]'
              }`}
            />
            <span className="hidden sm:inline">
              {upstreamOnline === true
                ? `Online (${latencyMs ? `${latencyMs}ms` : 'fast'})`
                : upstreamOnline === false
                  ? 'Reconnecting...'
                  : 'Checking API'}
            </span>
          </div>

          {/* Refresh button */}
          <button
            id="refresh-data-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center rounded-lg border border-[#33301f] bg-[#1e1b15] p-2 text-[#9b9583] transition-colors hover:border-[#e0a72e] hover:text-[#e0a72e] disabled:opacity-50"
            title="Refresh ticket data from API"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#e0a72e]' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
