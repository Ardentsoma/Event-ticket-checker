import React, { useState, useMemo, useEffect } from 'react';
import { TicketItem, AbujaEvent } from '../types';
import {
  Search,
  CheckCircle2,
  Clock,
  Mail,
  Copy,
  Check,
  Download,
  Filter,
  UserCheck,
  Ticket,
  ExternalLink,
  Layers,
  Music,
  Smile,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { PaginationControls } from './PaginationControls';

interface AttendeeRosterProps {
  event: AbujaEvent | null;
  isAllEvents: boolean;
  selectedSector: string | null;
  tickets: TicketItem[];
  isLoading: boolean;
  onToggleCheckIn: (ticketId: string) => void;
  checkedInIds: Set<string>;
  onSelectSingleEvent?: (eventId: string) => void;
}

export const AttendeeRoster: React.FC<AttendeeRosterProps> = ({
  event,
  isAllEvents,
  selectedSector,
  tickets,
  isLoading,
  onToggleCheckIn,
  checkedInIds,
  onSelectSingleEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState<'all' | 'concert' | 'comedy' | 'market' | 'meetup'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'reserved'>('all');
  const [checkInFilter, setCheckInFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'quantity' | 'event'>('date');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedList, setCopiedList] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sectorFilter, statusFilter, checkInFilter, sortBy]);

  // Sector icon helper
  const getSectorBadge = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case 'concert':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
            <Music className="h-2.5 w-2.5" /> Concert
          </span>
        );
      case 'comedy':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
            <Smile className="h-2.5 w-2.5" /> Comedy
          </span>
        );
      case 'market':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[10px] font-bold text-blue-300 uppercase">
            <ShoppingBag className="h-2.5 w-2.5" /> Market
          </span>
        );
      case 'meetup':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-bold text-purple-300 uppercase">
            <Users className="h-2.5 w-2.5" /> Meetup
          </span>
        );
      default:
        return cat ? (
          <span className="rounded bg-[#29251c] px-1.5 py-0.5 text-[10px] font-bold text-[#e0a72e] uppercase">
            {cat}
          </span>
        ) : null;
    }
  };

  // Filter & sort
  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        // Sector filter (when viewing All Events or mixed sectors)
        if (sectorFilter !== 'all' && t.eventCategory !== sectorFilter) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;

        // Check-in filter
        const isCheckedIn = checkedInIds.has(t.id);
        if (checkInFilter === 'checked-in' && !isCheckedIn) return false;
        if (checkInFilter === 'not-checked-in' && isCheckedIn) return false;

        // Search query (attendee name, email, ticket ID, or event title)
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          t.attendeeName.toLowerCase().includes(q) ||
          t.attendeeEmail.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.eventTitle && t.eventTitle.toLowerCase().includes(q)) ||
          (t.eventCategory && t.eventCategory.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.attendeeName.localeCompare(b.attendeeName);
        }
        if (sortBy === 'quantity') {
          return (b.quantity || 1) - (a.quantity || 1);
        }
        if (sortBy === 'event') {
          return (a.eventTitle || '').localeCompare(b.eventTitle || '');
        }
        // default date (newest first)
        return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime();
      });
  }, [tickets, searchQuery, sectorFilter, statusFilter, checkInFilter, sortBy, checkedInIds]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const pagedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, page, pageSize]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyList = () => {
    const text = filteredTickets
      .map(
        (t, i) =>
          `${i + 1}. ${t.attendeeName} (${t.attendeeEmail}) - ${t.quantity} ticket(s) [${t.status.toUpperCase()}] ${
            t.eventTitle ? `for "${t.eventTitle}" (${t.eventCategory})` : ''
          } ID: ${t.id}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 2500);
  };

  const handleExportCsv = () => {
    const headers = [
      'Attendee Name',
      'Email',
      'Quantity',
      'Status',
      'Checked In',
      'Sector / Category',
      'Event Title',
      'Event ID',
      'Ticket Price',
      'Purchase Date',
      'Ticket ID',
    ];
    const rows = filteredTickets.map((t) => [
      `"${t.attendeeName.replace(/"/g, '""')}"`,
      `"${t.attendeeEmail}"`,
      t.quantity,
      t.status,
      checkedInIds.has(t.id) ? 'Yes' : 'No',
      `"${t.eventCategory || event?.category || ''}"`,
      `"${(t.eventTitle || event?.title || '').replace(/"/g, '""')}"`,
      `"${t.eventId}"`,
      t.ticketPriceMinor ? t.ticketPriceMinor / 100 : event?.ticketPriceMinor ? event.ticketPriceMinor / 100 : 0,
      `"${new Date(t.purchasedAt).toISOString()}"`,
      `"${t.id}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = isAllEvents
      ? 'all-events-attendees.csv'
      : selectedSector
      ? `${selectedSector}-events-attendees.csv`
      : `attendees-${event?.id || 'event'}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatPrice = (minor: number, currency: string = 'NGN') => {
    if (minor === 0) return 'Free';
    const curr = currency === 'NGN' ? '₦' : currency;
    return `${curr}${(minor / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-NG', {
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div id="attendee-roster-section" className="space-y-4">
      {/* Controls Bar: Search + Filters */}
      <div className="rounded-2xl border border-[#33301f] bg-[#1a1712] p-4 shadow-sm space-y-3.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#9b9583]" />
            <input
              id="attendee-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAllEvents
                  ? 'Search all attendees across all sectors by name, email, event, or ID...'
                  : 'Search attendees by name, email, or ticket ID...'
              }
              className="w-full rounded-xl border border-[#33301f] bg-[#16140f] py-2.5 pl-10 pr-16 text-sm text-[#f0ece0] placeholder-[#9b9583] focus:border-[#e0a72e] focus:outline-none focus:ring-1 focus:ring-[#e0a72e]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 rounded-full px-2 py-0.5 text-xs text-[#9b9583] hover:text-[#f0ece0]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action buttons: Copy & Export */}
          <div className="flex items-center gap-2">
            <button
              id="copy-guestlist-btn"
              onClick={handleCopyList}
              disabled={filteredTickets.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-[#33301f] bg-[#16140f] px-3.5 py-2.5 text-xs font-semibold text-[#f0ece0] transition-colors hover:border-[#e0a72e] disabled:opacity-40"
              title="Copy attendee list to clipboard"
            >
              {copiedList ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#e0a72e]" />
                  <span>Copy List</span>
                </>
              )}
            </button>

            <button
              id="export-csv-btn"
              onClick={handleExportCsv}
              disabled={filteredTickets.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-[#e0a72e] px-4 py-2.5 text-xs font-bold text-[#16140f] transition-all hover:bg-[#e0a72e]/90 disabled:opacity-40"
              title="Export guest list as CSV file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Sector Quick Filter Pills (especially helpful when All Events is selected) */}
        {isAllEvents && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-[#33301f]/60 pt-3">
            <span className="text-xs font-semibold text-[#9b9583] flex items-center gap-1 mr-1">
              <Layers className="h-3 w-3 text-[#e0a72e]" /> Sector Filter:
            </span>
            {(['all', 'concert', 'comedy', 'market', 'meetup'] as const).map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSectorFilter(sec)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-all ${
                  sectorFilter === sec
                    ? 'bg-[#e0a72e] text-[#16140f] font-bold'
                    : 'bg-[#16140f] text-[#9b9583] hover:text-[#f0ece0] border border-[#33301f]/60'
                }`}
              >
                {sec === 'all' ? 'All Sectors' : `${sec}s`}
              </button>
            ))}
          </div>
        )}

        {/* Status, Check-in, and Sorting Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#33301f]/60 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#9b9583] flex items-center gap-1">
              <Filter className="h-3 w-3" /> Status:
            </span>
            {(['all', 'confirmed', 'reserved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-[#e0a72e] text-[#16140f] font-bold'
                    : 'bg-[#16140f] text-[#9b9583] hover:text-[#f0ece0]'
                }`}
              >
                {st}
              </button>
            ))}

            <span className="ml-2 text-xs font-medium text-[#9b9583] hidden sm:inline">|</span>

            {/* Check-in filter */}
            <span className="text-xs font-medium text-[#9b9583] hidden sm:inline">Door Check-in:</span>
            <select
              value={checkInFilter}
              onChange={(e) => setCheckInFilter(e.target.value as any)}
              className="rounded-lg border border-[#33301f] bg-[#16140f] px-2.5 py-1 text-xs text-[#f0ece0] focus:border-[#e0a72e] focus:outline-none"
            >
              <option value="all">All Door States</option>
              <option value="checked-in">Checked In</option>
              <option value="not-checked-in">Awaiting Door Check-in</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#9b9583]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-[#33301f] bg-[#16140f] px-2.5 py-1 text-xs text-[#f0ece0] focus:border-[#e0a72e] focus:outline-none"
            >
              <option value="date">Newest Order</option>
              <option value="name">Name (A-Z)</option>
              <option value="quantity">Ticket Quantity</option>
              {isAllEvents && <option value="event">Event Title</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Roster Header summary */}
      <div id="roster-summary-bar" className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-medium text-[#9b9583]">
        <div>
          Showing{' '}
          <span className="font-bold text-[#f0ece0]">
            {filteredTickets.length === 0
              ? 0
              : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, filteredTickets.length)}`}
          </span>{' '}
          of <span className="font-bold text-[#f0ece0]">{filteredTickets.length}</span> matching (
          <span className="text-[#e0a72e]">{tickets.length}</span> total) ticket buyers
          {isAllEvents ? (
            <span> across <strong className="text-[#e0a72e]">All Events & Sectors</strong></span>
          ) : selectedSector ? (
            <span> across <strong className="text-[#e0a72e]">All {selectedSector}s</strong></span>
          ) : event ? (
            <span> for <strong className="text-[#e0a72e]">"{event.title}"</strong></span>
          ) : null}
        </div>
        <div>
          {checkedInIds.size > 0 && (
            <span className="text-emerald-400 font-semibold">
              {checkedInIds.size} checked in at door
            </span>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-[#33301f] bg-[#1a1712] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#29251c]" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-40 rounded bg-[#29251c]" />
                    <div className="h-3 w-28 rounded bg-[#29251c]" />
                  </div>
                </div>
                <div className="h-8 w-24 rounded-lg bg-[#29251c]" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-[#33301f] bg-[#1a1712]/50 p-12 text-center">
          <Ticket className="mx-auto h-10 w-10 text-[#9b9583]" />
          <h3 className="mt-3 text-base font-bold text-[#f0ece0]">No ticket buyers found</h3>
          <p className="mt-1 text-xs text-[#9b9583] max-w-sm mx-auto">
            {searchQuery
              ? `No attendees matched "${searchQuery}". Try adjusting search keywords or sector filters.`
              : 'There are no ticket orders recorded matching the current filter.'}
          </p>
          {(searchQuery || sectorFilter !== 'all' || statusFilter !== 'all' || checkInFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSectorFilter('all');
                setStatusFilter('all');
                setCheckInFilter('all');
              }}
              className="mt-4 rounded-xl bg-[#e0a72e] px-4 py-2 text-xs font-bold text-[#16140f] hover:bg-[#e0a72e]/90"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        /* Attendee Card List */
        <div className="space-y-3">
          {pagedTickets.map((ticket) => {
            const isCheckedIn = checkedInIds.has(ticket.id);
            const ticketPrice = ticket.ticketPriceMinor || event?.ticketPriceMinor || 0;
            const totalOrderPrice = (ticket.quantity || 1) * ticketPrice;

            return (
              <div
                key={ticket.id}
                id={`ticket-card-${ticket.id}`}
                className={`group relative rounded-2xl border p-4 transition-all duration-200 ${
                  isCheckedIn
                    ? 'border-emerald-500/40 bg-emerald-950/15 shadow-sm'
                    : 'border-[#33301f] bg-[#1a1712] hover:border-[#e0a72e]/50'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Attendee Info */}
                  <div className="flex items-start gap-3.5">
                    {/* Avatar */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-inner ${
                        isCheckedIn
                          ? 'bg-emerald-500 text-[#16140f]'
                          : ticket.status === 'confirmed'
                          ? 'bg-gradient-to-br from-[#e0a72e] to-[#b45309] text-[#16140f]'
                          : 'bg-[#29251c] text-[#d6d0c0]'
                      }`}
                    >
                      {getInitials(ticket.attendeeName)}
                    </div>

                    {/* Name, Email, Meta */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-[#f0ece0]">
                          {ticket.attendeeName}
                        </span>

                        {ticket.quantity > 1 && (
                          <span className="rounded-md border border-[#e0a72e]/40 bg-[#e0a72e]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#e0a72e]">
                            Group ({ticket.quantity} Tickets)
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                            ticket.status === 'confirmed'
                              ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                              : 'border border-amber-500/40 bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {ticket.status}
                        </span>

                        {isCheckedIn && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Checked In
                          </span>
                        )}
                      </div>

                      {/* Event Title & Sector Badge if viewing across multiple events */}
                      {(isAllEvents || selectedSector || ticket.eventTitle) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {getSectorBadge(ticket.eventCategory || event?.category)}
                          {ticket.eventTitle && (
                            <button
                              type="button"
                              onClick={() => onSelectSingleEvent && onSelectSingleEvent(ticket.eventId)}
                              className="text-xs font-semibold text-[#f0ece0] hover:text-[#e0a72e] hover:underline truncate max-w-md text-left flex items-center gap-1"
                              title="Click to view guest list for this single event"
                            >
                              <span>{ticket.eventTitle}</span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9b9583]">
                        <a
                          href={`mailto:${ticket.attendeeEmail}`}
                          className="flex items-center gap-1 hover:text-[#f0ece0]"
                        >
                          <Mail className="h-3 w-3 text-[#e0a72e]" />
                          <span>{ticket.attendeeEmail}</span>
                        </a>

                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#e0a72e]" />
                          <span>Ordered {formatDateTime(ticket.purchasedAt)}</span>
                        </span>
                      </div>

                      {/* Ticket ID row */}
                      <div className="flex items-center gap-2 pt-0.5 text-[11px] text-[#9b9583]">
                        <span className="font-mono text-[#78716c]">ID: {ticket.id}</span>
                        <button
                          onClick={() => handleCopyId(ticket.id)}
                          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[#29251c] text-[#e0a72e]"
                          title="Copy Ticket ID"
                        >
                          {copiedId === ticket.id ? (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <Check className="h-3 w-3" /> Copied
                            </span>
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity, Price & Door Check-In Button */}
                  <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#33301f]/40 pt-2 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center gap-1.5 text-xs text-[#9b9583]">
                        <span className="rounded bg-[#232019] px-2 py-0.5 font-bold text-[#f0ece0]">
                          {ticket.quantity} {ticket.quantity === 1 ? 'ticket' : 'tickets'}
                        </span>
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-[#e0a72e]">
                        {formatPrice(totalOrderPrice, ticket.currency || event?.currency || 'NGN')}
                      </div>
                    </div>

                    {/* Check In Action Toggle */}
                    <button
                      id={`checkin-btn-${ticket.id}`}
                      onClick={() => onToggleCheckIn(ticket.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        isCheckedIn
                          ? 'border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'border border-[#33301f] bg-[#16140f] text-[#f0ece0] hover:border-emerald-500/60 hover:text-emerald-400'
                      }`}
                      title={isCheckedIn ? 'Click to uncheck' : 'Click to check in attendee at door'}
                    >
                      {isCheckedIn ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Checked In</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5 text-[#9b9583]" />
                          <span>Check In</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Attendee Pagination Controls */}
          {filteredTickets.length > 0 && (
            <div className="rounded-2xl border border-[#33301f] bg-[#1a1712] overflow-hidden shadow-xs">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredTickets.length}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50, 100]}
                onPageChange={(p) => {
                  setPage(p);
                  // Scroll to top of roster smoothly
                  const rosterHeader = document.getElementById('roster-summary-bar');
                  if (rosterHeader) {
                    rosterHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }
                }}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
                itemLabel="ticket buyers"
                className="bg-[#1a1712]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
