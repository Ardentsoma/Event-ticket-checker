import React from 'react';
import { AbujaEvent, TicketItem, SectorsBreakdown } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  TrendingUp,
  Layers,
  Music,
  Smile,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';

interface EventSummaryCardProps {
  event: AbujaEvent | null;
  isAllEvents: boolean;
  selectedSector: string | null;
  eventsCount: number;
  sectorsBreakdown?: SectorsBreakdown | null;
  tickets: TicketItem[];
  isLoadingTickets: boolean;
}

export const EventSummaryCard: React.FC<EventSummaryCardProps> = ({
  event,
  isAllEvents,
  selectedSector,
  eventsCount,
  sectorsBreakdown,
  tickets,
  isLoadingTickets,
}) => {
  const totalBuyers = tickets.length;
  const totalTicketsSold = tickets.reduce((sum, t) => sum + (t.quantity || 1), 0);

  // Total gross value calculated across tickets
  const totalGrossMinor = tickets.reduce((sum, t) => {
    const price = t.ticketPriceMinor || (event ? event.ticketPriceMinor || 0 : 0);
    return sum + (t.quantity || 1) * price;
  }, 0);

  const confirmedCount = tickets.filter((t) => t.status === 'confirmed').length;
  const reservedCount = tickets.filter((t) => t.status === 'reserved').length;

  const formatPrice = (minor: number, currency: string = 'NGN') => {
    if (minor === 0) return 'Free';
    const curr = currency === 'NGN' ? '₦' : currency;
    return `${curr}${(minor / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-NG', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Single event metrics
  const singleCapacity = event?.capacity || 0;
  const singleOccupancyPct = singleCapacity > 0 ? Math.min(100, Math.round((totalTicketsSold / singleCapacity) * 100)) : 0;

  return (
    <div
      id="event-summary-card"
      className="rounded-2xl border border-[#33301f] bg-[#1a1712] p-5 shadow-lg transition-all"
    >
      {/* Header section */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between border-b border-[#33301f]/70 pb-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {isAllEvents ? (
              <>
                <span className="flex items-center gap-1.5 rounded-md border border-[#e0a72e] bg-[#e0a72e]/20 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-[#e0a72e]">
                  <Layers className="h-3.5 w-3.5" />
                  All Sectors Included
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  {eventsCount || 173} Events Loaded
                </span>
              </>
            ) : selectedSector ? (
              <>
                <span className="rounded-md border border-[#e0a72e] bg-[#e0a72e]/20 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-[#e0a72e]">
                  Sector: {selectedSector.toUpperCase()}
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  {eventsCount} Sector Events
                </span>
              </>
            ) : event ? (
              <>
                <span className="rounded-md border border-[#e0a72e]/30 bg-[#e0a72e]/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#e0a72e]">
                  {event.category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    event.status === 'upcoming'
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : event.status === 'completed'
                      ? 'border border-[#33301f] bg-[#232019] text-[#9b9583]'
                      : 'border border-rose-500/30 bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {event.status}
                </span>
                <span className="text-xs font-medium text-[#9b9583]">ID: {event.id}</span>
              </>
            ) : null}
          </div>

          <h2 className="text-xl font-bold tracking-tight text-[#f0ece0] md:text-2xl">
            {isAllEvents
              ? 'All Events Happening in Abuja'
              : selectedSector
              ? `All ${selectedSector.charAt(0).toUpperCase() + selectedSector.slice(1)} Events in Abuja`
              : event?.title || 'Selected Event'}
          </h2>

          <p className="max-w-2xl text-xs text-[#9b9583]">
            {isAllEvents
              ? 'Viewing combined attendee records and ticket sales across all active events in Abuja regardless of sector.'
              : selectedSector
              ? `Aggregated guest list and ticket performance for all events in the ${selectedSector} sector.`
              : event?.description || 'Event ticket and attendee records.'}
          </p>

          {/* Details tag line */}
          {event && !isAllEvents && !selectedSector && (
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 text-xs text-[#d6d0c0]">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#e0a72e]" />
                {formatDateTime(event.startTime)}
              </span>
              {event.venueName && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#e0a72e]" />
                  <span className="font-medium text-[#f0ece0]">{event.venueName}</span>
                  {event.venueAddress && <span className="text-[#9b9583]">({event.venueAddress})</span>}
                </span>
              )}
            </div>
          )}

          {/* Sector distribution tags when in All Events mode */}
          {isAllEvents && sectorsBreakdown && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[#9b9583]">Sector Breakdown:</span>
              <span className="rounded-md bg-[#29251c] px-2 py-0.5 font-medium text-amber-300">
                Concerts: {sectorsBreakdown.concert}
              </span>
              <span className="rounded-md bg-[#29251c] px-2 py-0.5 font-medium text-emerald-300">
                Comedy: {sectorsBreakdown.comedy}
              </span>
              <span className="rounded-md bg-[#29251c] px-2 py-0.5 font-medium text-blue-300">
                Markets: {sectorsBreakdown.market}
              </span>
              <span className="rounded-md bg-[#29251c] px-2 py-0.5 font-medium text-purple-300">
                Meetups: {sectorsBreakdown.meetup}
              </span>
            </div>
          )}
        </div>

        {/* Right card badge */}
        <div className="flex shrink-0 items-center justify-between gap-4 rounded-xl border border-[#33301f] bg-[#16140f] px-4 py-3 md:flex-col md:items-end md:justify-center">
          <span className="text-xs font-medium text-[#9b9583]">
            {isAllEvents ? 'Active Events' : selectedSector ? 'Sector Events' : 'Single Ticket Price'}
          </span>
          <span className="text-lg font-bold text-[#e0a72e]">
            {isAllEvents
              ? `${eventsCount || 173} Events`
              : selectedSector
              ? `${eventsCount} Events`
              : formatPrice(event?.ticketPriceMinor || 0, event?.currency || 'NGN')}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Metric 1: Total Buyers */}
        <div className="rounded-xl border border-[#33301f]/80 bg-[#16140f] p-3">
          <div className="flex items-center justify-between text-[#9b9583]">
            <span className="text-xs font-medium">Ticket Buyers</span>
            <Users className="h-3.5 w-3.5 text-[#e0a72e]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#f0ece0]">
              {isLoadingTickets ? '…' : totalBuyers}
            </span>
            <span className="text-xs text-[#9b9583]">orders</span>
          </div>
          <div className="mt-1 text-[11px] text-[#9b9583]">
            {confirmedCount} confirmed • {reservedCount} reserved
          </div>
        </div>

        {/* Metric 2: Total Tickets Sold */}
        <div className="rounded-xl border border-[#33301f]/80 bg-[#16140f] p-3">
          <div className="flex items-center justify-between text-[#9b9583]">
            <span className="text-xs font-medium">Tickets Issued</span>
            <Ticket className="h-3.5 w-3.5 text-[#e0a72e]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#f0ece0]">
              {isLoadingTickets ? '…' : totalTicketsSold}
            </span>
            <span className="text-xs text-[#9b9583]">tickets</span>
          </div>
          <div className="mt-1 text-[11px] text-[#9b9583]">
            {totalBuyers > 0 ? (totalTicketsSold / totalBuyers).toFixed(1) : 0} avg / order
          </div>
        </div>

        {/* Metric 3: Gross Ticket Value */}
        <div className="rounded-xl border border-[#33301f]/80 bg-[#16140f] p-3">
          <div className="flex items-center justify-between text-[#9b9583]">
            <span className="text-xs font-medium">Gross Sales</span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-400">
              {isLoadingTickets ? '…' : formatPrice(totalGrossMinor, 'NGN')}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#9b9583]">
            {isAllEvents ? 'Across all sectors' : 'Total value'}
          </div>
        </div>

        {/* Metric 4: Scope / Capacity */}
        <div className="rounded-xl border border-[#33301f]/80 bg-[#16140f] p-3">
          <div className="flex items-center justify-between text-[#9b9583]">
            <span className="text-xs font-medium">
              {isAllEvents ? 'Sector Scope' : 'Venue Capacity'}
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 text-[#e0a72e]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#f0ece0]">
              {isAllEvents ? '4 Sectors' : singleCapacity > 0 ? `${singleOccupancyPct}%` : 'N/A'}
            </span>
            {!isAllEvents && singleCapacity > 0 && (
              <span className="text-xs text-[#9b9583]">booked</span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-[#9b9583]">
            {isAllEvents
              ? 'Concert, Comedy, Market, Meetup'
              : singleCapacity > 0
              ? `${totalTicketsSold} / ${singleCapacity} capacity`
              : 'Open admission'}
          </div>
        </div>
      </div>
    </div>
  );
};
