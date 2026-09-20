import React, { useState, useMemo, useEffect } from 'react';
import { AbujaEvent, TicketItem } from '../types';
import { Search, Loader2, User, Ticket, Calendar, MapPin, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchEventTickets } from '../api';
import { PaginationControls } from './PaginationControls';

interface GlobalAttendeeSearchProps {
  events: AbujaEvent[];
  onSelectEvent: (eventId: string) => void;
  checkedInIds: Set<string>;
  onToggleCheckIn: (ticketId: string) => void;
}

interface SearchResultMatch {
  ticket: TicketItem;
  event: AbujaEvent;
}

export const GlobalAttendeeSearch: React.FC<GlobalAttendeeSearchProps> = ({
  events,
  onSelectEvent,
  checkedInIds,
  onToggleCheckIn,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResultMatch[] | null>(null);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [searchProgress, setSearchProgress] = useState<{ checked: number; total: number } | null>(null);
  const [resultsPage, setResultsPage] = useState(1);
  const RESULTS_PER_PAGE = 10;

  useEffect(() => {
    setResultsPage(1);
  }, [results]);

  const totalResultsPages = Math.max(1, Math.ceil((results?.length || 0) / RESULTS_PER_PAGE));
  const pagedResults = useMemo(() => {
    if (!results) return [];
    const start = (resultsPage - 1) * RESULTS_PER_PAGE;
    return results.slice(start, start + RESULTS_PER_PAGE);
  }, [results, resultsPage]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) return;

    setIsSearching(true);
    setResults(null);
    setSearchedQuery(cleanQ);

    const matches: SearchResultMatch[] = [];
    const eventsToScan = events.slice(0, 15); // Scan top 15 recent events to keep fast and respect Render rate limits
    setSearchProgress({ checked: 0, total: eventsToScan.length });

    try {
      // Fetch tickets for events
      for (let i = 0; i < eventsToScan.length; i++) {
        const ev = eventsToScan[i];
        try {
          const res = await fetchEventTickets(ev.id);
          const tickets = res.data || [];
          for (const t of tickets) {
            if (
              t.attendeeName.toLowerCase().includes(cleanQ) ||
              t.attendeeEmail.toLowerCase().includes(cleanQ) ||
              t.id.toLowerCase().includes(cleanQ)
            ) {
              matches.push({ ticket: t, event: ev });
            }
          }
        } catch {
          // ignore single event failure
        }
        setSearchProgress({ checked: i + 1, total: eventsToScan.length });
      }

      setResults(matches);
    } catch (err) {
      console.error('Global search error:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatPrice = (minor: number, currency: string = 'NGN') => {
    if (minor === 0) return 'Free';
    const curr = currency === 'NGN' ? '₦' : currency;
    return `${curr}${(minor / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div id="global-attendee-search" className="space-y-4">
      {/* Intro Banner */}
      <div className="rounded-2xl border border-[#33301f] bg-[#1a1712] p-6 text-center shadow-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0a72e]/10 text-[#e0a72e]">
          <Search className="h-6 w-6 stroke-[2.5]" />
        </div>
        <h2 className="mt-3 text-lg font-bold text-[#f0ece0] md:text-xl">
          Cross-Event Attendee & Ticket Lookup
        </h2>
        <p className="mt-1 text-xs text-[#9b9583] max-w-md mx-auto">
          Need to verify a customer or check if someone bought a ticket but not sure which event? Search by attendee name, email address, or ticket ID.
        </p>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="mt-5 mx-auto max-w-xl">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-[#9b9583]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Dale Koelpin, Laron52@yahoo.com, or ticket ID"
                className="w-full rounded-xl border border-[#33301f] bg-[#16140f] py-2.5 pl-10 pr-4 text-sm text-[#f0ece0] placeholder-[#9b9583] focus:border-[#e0a72e] focus:outline-none focus:ring-1 focus:ring-[#e0a72e]"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#e0a72e] px-5 py-2.5 text-xs font-bold text-[#16140f] transition-all hover:bg-[#e0a72e]/90 disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Find Ticket</span>
                </>
              )}
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 text-xs text-[#9b9583]">
            <span>Try quick sample:</span>
            {['Dale Koelpin', 'Sylvester', 'Billy Swift'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setQuery(name);
                }}
                className="rounded-md border border-[#33301f] bg-[#1e1b15] px-2 py-0.5 text-[11px] text-[#e0a72e] hover:border-[#e0a72e]"
              >
                {name}
              </button>
            ))}
          </div>
        </form>

        {isSearching && searchProgress && (
          <div className="mt-4 text-xs text-[#9b9583]">
            Scanning live event guest lists ({searchProgress.checked} of {searchProgress.total} events scanned)...
          </div>
        )}
      </div>

      {/* Results Section */}
      {results !== null && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-semibold text-[#9b9583]">
            <span>
              Found <strong className="text-[#f0ece0]">{results.length}</strong> matching ticket order(s) for "{searchedQuery}"
            </span>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#33301f] bg-[#1a1712]/50 p-8 text-center text-xs text-[#9b9583]">
              No ticket orders found for "{searchedQuery}". Make sure the name or email matches the registered buyer.
            </div>
          ) : (
            <>
              {pagedResults.map(({ ticket, event }) => {
                const isCheckedIn = checkedInIds.has(ticket.id);
                const totalPrice = (ticket.quantity || 1) * (event.ticketPriceMinor || 0);

                return (
                  <div
                    key={`${event.id}-${ticket.id}`}
                    className="rounded-2xl border border-[#33301f] bg-[#1a1712] p-5 shadow-sm transition-all hover:border-[#e0a72e]/50"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        {/* Event Banner */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-[#29251c] px-2 py-0.5 text-[11px] font-bold text-[#e0a72e] uppercase">
                            Event: {event.category}
                          </span>
                          <h4 className="text-base font-bold text-[#f0ece0]">{event.title}</h4>
                        </div>

                        {/* Attendee Details */}
                        <div className="rounded-xl border border-[#33301f]/70 bg-[#16140f] p-3.5 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[#f0ece0]">
                              {ticket.attendeeName}
                            </span>
                            <span className="text-xs text-[#9b9583]">({ticket.attendeeEmail})</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                                ticket.status === 'confirmed'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              }`}
                            >
                              {ticket.status}
                            </span>
                            {isCheckedIn && (
                              <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-500/40">
                                Checked In
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9b9583]">
                            <span>Ticket Count: <strong className="text-[#f0ece0]">{ticket.quantity}</strong></span>
                            <span>Value: <strong className="text-[#e0a72e]">{formatPrice(totalPrice, event.currency || 'NGN')}</strong></span>
                            <span className="font-mono text-[#78716c]">ID: {ticket.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col gap-2 shrink-0 sm:items-end">
                        <button
                          onClick={() => onSelectEvent(event.id)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#e0a72e] px-3.5 py-2 text-xs font-bold text-[#16140f] hover:bg-[#e0a72e]/90"
                        >
                          <span>Open Event Guest List</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => onToggleCheckIn(ticket.id)}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                            isCheckedIn
                              ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                              : 'border-[#33301f] bg-[#16140f] text-[#f0ece0] hover:border-emerald-500/60'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{isCheckedIn ? 'Checked In' : 'Door Check-in'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Search Results Pagination */}
              {results.length > RESULTS_PER_PAGE && (
                <div className="rounded-2xl border border-[#33301f] bg-[#1a1712] overflow-hidden shadow-xs">
                  <PaginationControls
                    currentPage={resultsPage}
                    totalPages={totalResultsPages}
                    totalItems={results.length}
                    pageSize={RESULTS_PER_PAGE}
                    onPageChange={(p) => setResultsPage(p)}
                    itemLabel="matching tickets"
                    className="bg-[#1a1712]"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
