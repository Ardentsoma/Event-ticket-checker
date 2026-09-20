import { useState, useEffect, useCallback, useMemo } from 'react';
import { AbujaEvent, TicketItem, ApiHealth, SectorsBreakdown } from './types';
import { fetchAllEvents, fetchAllTickets, fetchEventTickets, fetchHealth } from './api';
import { Header } from './components/Header';
import { EventPicker, ALL_EVENTS_ID } from './components/EventPicker';
import { EventSummaryCard } from './components/EventSummaryCard';
import { AttendeeRoster } from './components/AttendeeRoster';
import { GlobalAttendeeSearch } from './components/GlobalAttendeeSearch';
import { EventsCatalogBrowser } from './components/EventsCatalogBrowser';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Navigation view
  const [activeView, setActiveView] = useState<'event-roster' | 'global-lookup' | 'events-directory'>('event-roster');

  // Events list state
  const [events, setEvents] = useState<AbujaEvent[]>([]);
  const [sectorsBreakdown, setSectorsBreakdown] = useState<SectorsBreakdown | null>(null);
  // Default to ALL_EVENTS so the user can immediately see all events happening regardless of sector
  const [selectedEventId, setSelectedEventId] = useState<string>(ALL_EVENTS_ID);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Tickets state for current selection (all events or single event)
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  // Door check-in state (persisted in localStorage for convenience)
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('checked_in_tickets');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Health and connection state
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Determine current selection mode
  const isAllEvents = selectedEventId === ALL_EVENTS_ID;
  const isSectorAll = selectedEventId.startsWith('ALL_SECTOR_');
  const selectedSector = isSectorAll ? selectedEventId.replace('ALL_SECTOR_', '').toLowerCase() : null;

  // Single event object if in single event mode
  const selectedEvent = useMemo(() => {
    if (isAllEvents || isSectorAll) return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId, isAllEvents, isSectorAll]);

  // Save checked-in tickets to localStorage
  const handleToggleCheckIn = useCallback((ticketId: string) => {
    setCheckedInIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      try {
        localStorage.setItem('checked_in_tickets', JSON.stringify(Array.from(next)));
      } catch {
        // storage quota or disabled
      }
      return next;
    });
  }, []);

  // Fetch health check
  const checkApiHealth = useCallback(async () => {
    try {
      const h = await fetchHealth();
      setHealth({
        status: h.online ? 'ok' : 'degraded',
        upstream: h.online ? 'connected' : 'unreachable',
        latencyMs: h.latencyMs,
        upstreamUrl: 'https://events-api-a9et.onrender.com/api/v1',
      });
    } catch {
      setHealth({
        status: 'degraded',
        upstream: 'unreachable',
        upstreamUrl: 'https://events-api-a9et.onrender.com/api/v1',
      });
    }
  }, []);

  // Fetch ALL events (all 173 events across all sectors)
  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const res = await fetchAllEvents();
      if (res.data && res.data.length > 0) {
        setEvents(res.data);
        if (res.sectorsBreakdown) {
          setSectorsBreakdown(res.sectorsBreakdown);
        }
      } else {
        setEventsError('Could not load events list from Render API');
      }
    } catch (err: any) {
      setEventsError(err.message || 'Failed to connect to events API');
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Fetch tickets based on selection (All Events, Sector, or Single Event)
  const loadTickets = useCallback(
    async (targetId: string) => {
      setIsLoadingTickets(true);
      setTicketsError(null);

      try {
        if (targetId === ALL_EVENTS_ID) {
          // Fetch tickets across ALL events regardless of sector
          const res = await fetchAllTickets();
          if (res.data) {
            setTickets(res.data);
          } else if (res.error) {
            setTicketsError(res.error.message);
            setTickets([]);
          }
        } else if (targetId.startsWith('ALL_SECTOR_')) {
          // Fetch tickets for all events in specific sector
          const sec = targetId.replace('ALL_SECTOR_', '').toLowerCase();
          const res = await fetchAllTickets(sec);
          if (res.data) {
            setTickets(res.data);
          } else if (res.error) {
            setTicketsError(res.error.message);
            setTickets([]);
          }
        } else {
          // Single event tickets
          const res = await fetchEventTickets(targetId);
          if (res.data) {
            // Enrich tickets with event info
            const ev = events.find((e) => e.id === targetId);
            const enriched = res.data.map((t) => ({
              ...t,
              eventTitle: ev?.title,
              eventCategory: ev?.category,
              ticketPriceMinor: ev?.ticketPriceMinor,
              currency: ev?.currency || 'NGN',
            }));
            setTickets(enriched);
          } else if (res.error) {
            setTicketsError(res.error.message);
            setTickets([]);
          }
        }
      } catch (err: any) {
        setTicketsError(err.message || 'Failed to fetch tickets');
        setTickets([]);
      } finally {
        setIsLoadingTickets(false);
      }
    },
    [events]
  );

  // Initial load
  useEffect(() => {
    loadEvents();
    checkApiHealth();
  }, [loadEvents, checkApiHealth]);

  // When selected target changes, load its tickets
  useEffect(() => {
    if (selectedEventId) {
      loadTickets(selectedEventId);
    }
  }, [selectedEventId, loadTickets]);

  // Refresh data handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([checkApiHealth(), loadEvents(), loadTickets(selectedEventId)]);
    setIsRefreshing(false);
  };

  // Compute active events count
  const activeEventsCount = useMemo(() => {
    if (isAllEvents) return events.length || 173;
    if (isSectorAll && selectedSector) {
      return events.filter((e) => e.category === selectedSector).length;
    }
    return 1;
  }, [events, isAllEvents, isSectorAll, selectedSector]);

  return (
    <div className="min-h-screen bg-[#16140f] text-[#f0ece0] antialiased">
      {/* Header */}
      <Header
        upstreamOnline={health?.upstream === 'connected'}
        latencyMs={health?.latencyMs}
        activeView={activeView}
        onSelectView={setActiveView}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 space-y-6">
        {/* Error Banner if any */}
        {(eventsError || ticketsError) && (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{eventsError || ticketsError}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="font-bold underline hover:text-rose-100 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* View 1: Event Roster & Ticket Checking */}
        {activeView === 'event-roster' ? (
          <div className="space-y-6">
            {/* 1. Event Selector with All Events & Sector Capabilities */}
            <EventPicker
              events={events}
              selectedEventId={selectedEventId}
              onSelectEvent={(id) => setSelectedEventId(id)}
              isLoading={isLoadingEvents}
              sectorsBreakdown={sectorsBreakdown}
            />

            {/* 2. Event Summary Card & Key Metrics */}
            <EventSummaryCard
              event={selectedEvent}
              isAllEvents={isAllEvents}
              selectedSector={selectedSector}
              eventsCount={activeEventsCount}
              sectorsBreakdown={sectorsBreakdown}
              tickets={tickets}
              isLoadingTickets={isLoadingTickets}
            />

            {/* 3. Attendee Roster & Ticket Checker List */}
            {isLoadingEvents && events.length === 0 ? (
              <div className="rounded-2xl border border-[#33301f] bg-[#1a1712] p-12 text-center text-xs text-[#9b9583]">
                <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#e0a72e]" />
                <p className="mt-2 font-medium">Connecting to Abuja Events API on Render...</p>
              </div>
            ) : (
              <AttendeeRoster
                event={selectedEvent}
                isAllEvents={isAllEvents}
                selectedSector={selectedSector}
                tickets={tickets}
                isLoading={isLoadingTickets}
                onToggleCheckIn={handleToggleCheckIn}
                checkedInIds={checkedInIds}
                onSelectSingleEvent={(eventId) => setSelectedEventId(eventId)}
              />
            )}
          </div>
        ) : activeView === 'events-directory' ? (
          /* View 2: All Events Catalogue Browser with Direct Upstream Pagination */
          <EventsCatalogBrowser
            onSelectEvent={(eventId) => {
              setSelectedEventId(eventId);
              setActiveView('event-roster');
            }}
          />
        ) : (
          /* View 3: Cross-Event Attendee Lookup */
          <GlobalAttendeeSearch
            events={events}
            onSelectEvent={(id) => {
              setSelectedEventId(id);
              setActiveView('event-roster');
            }}
            checkedInIds={checkedInIds}
            onToggleCheckIn={handleToggleCheckIn}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#33301f]/70 bg-[#14120e] py-6 text-center text-xs text-[#9b9583]">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Connected to Abuja Events API at{' '}
            <code className="text-[#e0a72e]">events-api-a9et.onrender.com</code>
          </span>
          <span>
            Endpoint:{' '}
            <code className="text-[#d6d0c0]">
              {isAllEvents ? '/api/all-tickets' : '/api/v1/events/:id/tickets'}
            </code>
          </span>
        </div>
      </footer>
    </div>
  );
}
