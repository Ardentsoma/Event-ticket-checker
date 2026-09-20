import React, { useState, useMemo, useEffect } from 'react';
import { AbujaEvent, SectorsBreakdown } from '../types';
import {
  Calendar,
  MapPin,
  ChevronDown,
  Search,
  Check,
  Layers,
  Sparkles,
  Ticket,
  Music,
  Smile,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { PaginationControls } from './PaginationControls';

export const ALL_EVENTS_ID = 'ALL_EVENTS';

interface EventPickerProps {
  events: AbujaEvent[];
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
  isLoading?: boolean;
  sectorsBreakdown?: SectorsBreakdown | null;
}

export const EventPicker: React.FC<EventPickerProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  isLoading,
  sectorsBreakdown,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState<'all' | 'concert' | 'comedy' | 'market' | 'meetup'>('all');
  const [eventPage, setEventPage] = useState(1);
  const EVENTS_PER_PAGE = 20;

  const isAllEventsSelected = selectedEventId === ALL_EVENTS_ID;
  const isSectorAllSelected = selectedEventId.startsWith('ALL_SECTOR_');
  const selectedSector = isSectorAllSelected ? selectedEventId.replace('ALL_SECTOR_', '').toLowerCase() : null;

  const selectedEvent = useMemo(() => {
    if (isAllEventsSelected || isSectorAllSelected) return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId, isAllEventsSelected, isSectorAllSelected]);

  // Sector counts
  const counts = useMemo(() => {
    return {
      all: events.length,
      concert: events.filter((e) => e.category === 'concert').length,
      comedy: events.filter((e) => e.category === 'comedy').length,
      market: events.filter((e) => e.category === 'market').length,
      meetup: events.filter((e) => e.category === 'meetup').length,
    };
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchSector = sectorFilter === 'all' || e.category === sectorFilter;
      if (!matchSector) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.venueName && e.venueName.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q)
      );
    });
  }, [events, searchQuery, sectorFilter]);

  // Reset page when search or sector changes
  useEffect(() => {
    setEventPage(1);
  }, [searchQuery, sectorFilter]);

  const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const pagedEvents = useMemo(() => {
    const start = (eventPage - 1) * EVENTS_PER_PAGE;
    return filteredEvents.slice(start, start + EVENTS_PER_PAGE);
  }, [filteredEvents, eventPage]);

  const formatPrice = (minor?: number | null, currency?: string | null) => {
    if (!minor || minor === 0) return 'Free';
    const curr = currency === 'NGN' ? '₦' : (currency || '₦');
    return `${curr}${(minor / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-NG', {
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
        return <ShoppingBag className="h-3 w-3 text-blue-400" />;
      case 'meetup':
        return <Users className="h-3 w-3 text-purple-400" />;
      default:
        return <Ticket className="h-3 w-3 text-[#e0a72e]" />;
    }
  };

  return (
    <div className="relative w-full space-y-2.5">
      {/* Quick Sector / All Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9b9583] flex items-center gap-1.5">
          <span>Event Selection</span>
          <span className="text-[10px] text-[#78716c]">({events.length} Total Events)</span>
        </label>

        {/* Quick Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="select-all-events-btn"
            type="button"
            onClick={() => onSelectEvent(ALL_EVENTS_ID)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              isAllEventsSelected
                ? 'bg-[#e0a72e] text-[#16140f] shadow-sm'
                : 'border border-[#33301f] bg-[#1e1b15] text-[#d6d0c0] hover:border-[#e0a72e]/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Select All Events ({events.length || 173})</span>
          </button>

          {(['concert', 'comedy', 'market', 'meetup'] as const).map((cat) => {
            const isCatSelected = selectedEventId === `ALL_SECTOR_${cat.toUpperCase()}`;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectEvent(`ALL_SECTOR_${cat.toUpperCase()}`)}
                className={`hidden sm:flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium capitalize transition-all ${
                  isCatSelected
                    ? 'bg-[#e0a72e]/20 border border-[#e0a72e] text-[#e0a72e]'
                    : 'border border-[#33301f]/80 bg-[#16140f] text-[#9b9583] hover:text-[#f0ece0] hover:border-[#e0a72e]/40'
                }`}
              >
                {getSectorIcon(cat)}
                <span>All {cat}s ({counts[cat] || 0})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Selector Box */}
      <button
        id="event-picker-trigger"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#e0a72e]/40 ${
          isAllEventsSelected
            ? 'border-[#e0a72e] bg-[#1e1b15] shadow-md ring-1 ring-[#e0a72e]/20'
            : isSectorAllSelected
            ? 'border-[#e0a72e]/80 bg-[#1e1b15]'
            : 'border-[#33301f] bg-[#1a1712] hover:border-[#e0a72e]/60'
        }`}
      >
        {isAllEventsSelected ? (
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-[#e0a72e] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-[#16140f]">
                <Layers className="h-3.5 w-3.5" />
                All Events Selected
              </span>
              <span className="text-base font-bold text-[#f0ece0]">
                All Events Happening in Abuja (Regardless of Sector)
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#9b9583]">
              <span>Scanning all <strong>{events.length || 173} events</strong></span>
              <span>•</span>
              <span className="text-amber-300">Concerts: {counts.concert}</span>
              <span>•</span>
              <span className="text-emerald-300">Comedy: {counts.comedy}</span>
              <span>•</span>
              <span className="text-blue-300">Markets: {counts.market}</span>
              <span>•</span>
              <span className="text-purple-300">Meetups: {counts.meetup}</span>
            </div>
          </div>
        ) : isSectorAllSelected && selectedSector ? (
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-[#e0a72e] bg-[#e0a72e]/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#e0a72e]">
                Sector: {selectedSector}s
              </span>
              <span className="text-base font-bold text-[#f0ece0]">
                All {selectedSector.charAt(0).toUpperCase() + selectedSector.slice(1)} Events ({counts[selectedSector as keyof typeof counts] || 0} events)
              </span>
            </div>
            <p className="mt-1 text-xs text-[#9b9583]">
              Aggregating ticket buyers across all {selectedSector} events happening in Abuja.
            </p>
          </div>
        ) : selectedEvent ? (
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-base font-bold text-[#f0ece0]">
                {selectedEvent.title}
              </span>
              <span className="rounded-md border border-[#33301f] bg-[#16140f] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#e0a72e]">
                {selectedEvent.category}
              </span>
              <span className="text-xs font-medium text-emerald-400">
                {formatPrice(selectedEvent.ticketPriceMinor, selectedEvent.currency)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#9b9583]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#e0a72e]" />
                {formatDate(selectedEvent.startTime)}
              </span>
              {selectedEvent.venueName && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 text-[#e0a72e]" />
                  {selectedEvent.venueName}
                </span>
              )}
              <span>• Single Event Mode</span>
            </div>
          </div>
        ) : (
          <span className="text-sm text-[#9b9583]">
            {isLoading ? 'Loading events catalogue from Render API...' : 'Select an event or all events'}
          </span>
        )}

        <div className="flex items-center gap-1.5 rounded-xl bg-[#29251c] px-3 py-2 text-xs font-bold text-[#e0a72e] shrink-0">
          <span>Change / Browse</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Modal/Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />
          <div
            id="event-picker-dropdown"
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[580px] overflow-hidden rounded-2xl border border-[#33301f] bg-[#1a1712] shadow-2xl"
          >
            {/* Search Header */}
            <div className="border-b border-[#33301f] bg-[#16140f] p-3.5 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#9b9583]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter 173 events by title, sector, or venue..."
                  className="w-full rounded-xl border border-[#33301f] bg-[#1e1b15] py-2.5 pl-10 pr-4 text-sm text-[#f0ece0] placeholder-[#9b9583] focus:border-[#e0a72e] focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Sector filters within dropdown */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#9b9583] mr-1">Filter sector:</span>
                {(['all', 'concert', 'comedy', 'market', 'meetup'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSectorFilter(cat)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-all ${
                      sectorFilter === cat
                        ? 'bg-[#e0a72e] text-[#16140f] font-bold'
                        : 'bg-[#1e1b15] text-[#9b9583] hover:text-[#f0ece0]'
                    }`}
                  >
                    {cat === 'all' ? `All Sectors (${counts.all})` : `${cat}s (${counts[cat]})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Selection Block: Select All Events */}
            <div className="border-b border-[#33301f] bg-[#1e1b15] p-2 space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  onSelectEvent(ALL_EVENTS_ID);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left transition-all ${
                  isAllEventsSelected
                    ? 'bg-[#e0a72e]/20 border border-[#e0a72e] text-[#f0ece0]'
                    : 'bg-[#16140f] border border-[#33301f] hover:border-[#e0a72e]/60 text-[#d6d0c0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e0a72e] text-[#16140f]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#f0ece0]">
                        Select All Events (Regardless of Sector)
                      </span>
                      <span className="rounded bg-[#e0a72e]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#e0a72e]">
                        {events.length} Events Total
                      </span>
                    </div>
                    <p className="text-xs text-[#9b9583]">
                      Combines attendees across concerts, comedy shows, markets, and meetups into one master list.
                    </p>
                  </div>
                </div>

                {isAllEventsSelected && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e0a72e] text-[#16140f]">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Sector All buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                {(['concert', 'comedy', 'market', 'meetup'] as const).map((sec) => {
                  const targetId = `ALL_SECTOR_${sec.toUpperCase()}`;
                  const isCurSelected = selectedEventId === targetId;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        onSelectEvent(targetId);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition-all ${
                        isCurSelected
                          ? 'border-[#e0a72e] bg-[#e0a72e]/15 text-[#f0ece0]'
                          : 'border-[#33301f] bg-[#16140f] text-[#9b9583] hover:border-[#e0a72e]/40 hover:text-[#f0ece0]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {getSectorIcon(sec)}
                        <span className="capitalize font-medium truncate">All {sec}s</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#e0a72e] shrink-0 ml-1">
                        {counts[sec]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event List (Individual Events) */}
            <div className="max-h-[300px] overflow-y-auto divide-y divide-[#33301f]/40 p-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9b9583]">
                Or Select an Individual Event ({filteredEvents.length}):
              </div>

              {filteredEvents.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#9b9583]">
                  No events found matching "{searchQuery}"
                </div>
              ) : (
                pagedEvents.map((evt) => {
                  const isSelected = evt.id === selectedEventId;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => {
                        onSelectEvent(evt.id);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 p-3 text-left transition-colors rounded-xl ${
                        isSelected
                          ? 'bg-[#e0a72e]/15 text-[#f0ece0]'
                          : 'hover:bg-[#232019] text-[#d6d0c0]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate text-[#f0ece0]">
                            {evt.title}
                          </span>
                          <span className="rounded bg-[#16140f] px-1.5 py-0.2 text-[10px] uppercase font-bold text-[#e0a72e] shrink-0">
                            {evt.category}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2.5 text-xs text-[#9b9583]">
                          <span>{formatDate(evt.startTime)}</span>
                          {evt.venueName && <span>• {evt.venueName}</span>}
                          <span>• {formatPrice(evt.ticketPriceMinor, evt.currency)}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e0a72e] text-[#16140f]">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {filteredEvents.length > EVENTS_PER_PAGE && (
              <PaginationControls
                currentPage={eventPage}
                totalPages={totalEventPages}
                totalItems={filteredEvents.length}
                pageSize={EVENTS_PER_PAGE}
                onPageChange={(p) => setEventPage(p)}
                itemLabel="events"
                className="rounded-b-2xl border-t border-[#33301f] bg-[#16140f]"
              />
            )}

            <div className="border-t border-[#33301f] bg-[#14120e] px-4 py-2 flex items-center justify-between text-[11px] text-[#9b9583]">
              <span>Upstream API catalogue: <strong>{events.length} total events</strong></span>
              <span>
                Showing page {eventPage} of {totalEventPages} ({filteredEvents.length} filtered)
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
