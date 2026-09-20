import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AbujaEvent, EventsApiResponse } from '../types';
import { fetchEvents, fetchVenues } from '../api';
import { PaginationControls } from './PaginationControls';
import {
  Calendar,
  MapPin,
  Ticket,
  Search,
  Users,
  RefreshCw,
  ExternalLink,
  Music,
  Smile,
  ShoppingBag,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface EventsCatalogBrowserProps {
  onSelectEvent: (eventId: string) => void;
}

export const EventsCatalogBrowser: React.FC<EventsCatalogBrowserProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<AbujaEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(173);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [category, setCategory] = useState<'all' | 'concert' | 'comedy' | 'market' | 'meetup'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch paginated events directly from API
  const loadPage = useCallback(
    async (targetPage: number, targetPageSize: number, targetCategory: string) => {
      setIsLoading(true);
      setError(null);
      const offset = (targetPage - 1) * targetPageSize;

      try {
        const res: EventsApiResponse = await fetchEvents({
          limit: targetPageSize,
          offset,
          category: targetCategory === 'all' ? undefined : targetCategory,
        });

        if (res.data) {
          setEvents(res.data);
          if (res.meta && typeof res.meta.total === 'number') {
            setTotalEvents(res.meta.total);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch paginated events from upstream API');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPage(page, pageSize, category);
  }, [page, pageSize, category, loadPage]);

  // Client-side instant keyword filter on top of the current page
  const displayedEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase().trim();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.venueName && e.venueName.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(totalEvents / pageSize));

  const formatPrice = (minor?: number | null, currency?: string | null) => {
    if (!minor || minor === 0) return 'Free';
    const curr = currency === 'NGN' ? '₦' : currency || '₦';
    return `${curr}${(minor / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-NG', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const getSectorIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'concert':
        return <Music className="h-3 w-3 text-amber-400" />;
      case 'comedy':
        return <Smile className="h-3 w-3 text-emerald-400" />;
      case 'market':
        return <ShoppingBag className="h-3 w-3 text-sky-400" />;
      case 'meetup':
        return <Users className="h-3 w-3 text-purple-400" />;
      default:
        return <Ticket className="h-3 w-3 text-[#e0a72e]" />;
    }
  };

  return (
    <div id="events-catalog-browser" className="space-y-5">
      {/* Header card */}
      <div className="rounded-2xl border border-[#33301f] bg-[#1a1712] p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#e0a72e]/20 border border-[#e0a72e]/40 px-2 py-0.5 text-[11px] font-bold text-[#e0a72e] uppercase">
                Upstream API Pagination
              </span>
              <span className="text-xs text-[#9b9583]">limit & offset driven</span>
            </div>
            <h2 className="mt-1.5 text-xl font-bold text-[#f0ece0]">
              Events Directory & Catalogue
            </h2>
            <p className="mt-1 text-xs text-[#9b9583]">
              Browse all 173 events happening across Abuja with direct upstream pagination. Click any event to check its ticket buyers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadPage(page, pageSize, category)}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-[#33301f] bg-[#16140f] px-3.5 py-2 text-xs font-semibold text-[#f0ece0] hover:border-[#e0a72e] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#e0a72e]' : ''}`} />
              <span>Refresh Page</span>
            </button>
          </div>
        </div>

        {/* Sector Tabs & Page Size Bar */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#33301f] pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[#9b9583] mr-1">Sector:</span>
            {(['all', 'concert', 'comedy', 'market', 'meetup'] as const).map((sec) => {
              const isSelected = category === sec;
              return (
                <button
                  key={sec}
                  onClick={() => {
                    setCategory(sec);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                    isSelected
                      ? 'bg-[#e0a72e] text-[#16140f] font-bold shadow-xs'
                      : 'border border-[#33301f] bg-[#16140f] text-[#9b9583] hover:border-[#e0a72e]/50 hover:text-[#f0ece0]'
                  }`}
                >
                  {sec !== 'all' && getSectorIcon(sec)}
                  <span>{sec === 'all' ? 'All Sectors' : sec}</span>
                </button>
              );
            })}
          </div>

          {/* Search box within current page */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9b9583]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search on this page..."
              className="w-full rounded-xl border border-[#33301f] bg-[#16140f] py-1.5 pl-8 pr-3 text-xs text-[#f0ece0] placeholder-[#78716c] focus:border-[#e0a72e] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-xs text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => loadPage(page, pageSize, category)}
            className="font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Events Grid / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-[#33301f] bg-[#1a1712] p-4"
            />
          ))}
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#33301f] bg-[#1a1712]/50 p-12 text-center text-xs text-[#9b9583]">
          No events found on this page matching "{searchQuery}". Try clearing search keywords.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedEvents.map((evt) => (
            <div
              key={evt.id}
              className="group flex flex-col justify-between rounded-2xl border border-[#33301f] bg-[#1a1712] p-4 transition-all duration-200 hover:border-[#e0a72e]/60 hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded bg-[#232019] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#e0a72e] border border-[#33301f]">
                      {getSectorIcon(evt.category)}
                      <span>{evt.category}</span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {formatPrice(evt.ticketPriceMinor, evt.currency)}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                      evt.status === 'upcoming'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#29251c] text-[#9b9583]'
                    }`}
                  >
                    {evt.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#f0ece0] group-hover:text-[#e0a72e] transition-colors line-clamp-1">
                  {evt.title}
                </h3>

                {evt.description && (
                  <p className="text-xs text-[#9b9583] line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-[#33301f]/60 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9b9583]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-[#e0a72e]" />
                      <span>{formatDate(evt.startTime)}</span>
                    </div>
                    {evt.venueName && (
                      <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                        <MapPin className="h-3 w-3 text-[#78716c]" />
                        <span className="truncate">{evt.venueName}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectEvent(evt.id)}
                    className="flex items-center gap-1 rounded-xl bg-[#e0a72e]/10 border border-[#e0a72e]/30 px-3 py-1.5 text-xs font-bold text-[#e0a72e] hover:bg-[#e0a72e] hover:text-[#16140f] transition-all"
                  >
                    <span>Check Buyers</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Pagination Controls Bar */}
      <div className="rounded-2xl border border-[#33301f] bg-[#1a1712] overflow-hidden shadow-xs">
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalEvents}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          itemLabel="events in API catalogue"
          isLoading={isLoading}
          className="bg-[#1a1712]"
        />
      </div>
    </div>
  );
};
