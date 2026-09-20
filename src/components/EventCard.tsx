import React, { useState } from 'react';
import { MapPin, Users, Calendar, Clock, ChevronDown, ChevronUp, Code } from 'lucide-react';
import { AbujaEvent } from '../types';
import { formatPrice, formatDateTimeRange } from '../utils/formatters';

interface EventCardProps {
  event: AbujaEvent;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [expanded, setExpanded] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const statusColorClass =
    event.status === 'upcoming'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : event.status === 'cancelled'
        ? 'border-[#e0623a]/30 bg-[#e0623a]/10 text-[#e0623a]'
        : 'border-[#33301f] bg-[#1e1b15] text-[#9b9583]';

  return (
    <article
      id={`event-card-${event.id}`}
      className="group border-b border-[#33301f] py-4.5 transition-colors hover:bg-[#1e1b15]/40"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left column: Title & Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-semibold tracking-tight text-[#f0ece0] group-hover:text-[#e0a72e] transition-colors">
              {event.title || 'Untitled event'}
            </h3>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#9b9583]">
            {/* Category badge */}
            <span className="inline-block rounded-full bg-[#33301f] px-2 py-0.5 text-[11px] font-medium lowercase text-[#f0ece0]">
              {event.category || 'event'}
            </span>

            {/* Time & Date */}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#9b9583]" />
              {formatDateTimeRange(event.startTime, event.endTime)}
            </span>

            {/* Status */}
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusColorClass}`}
            >
              {event.status || 'upcoming'}
            </span>

            {/* Venue if known */}
            {event.venueName && (
              <span className="inline-flex items-center gap-1 text-[#f0ece0]/90">
                <MapPin className="h-3 w-3 text-[#e0a72e]" />
                <span className="truncate max-w-[200px]">
                  {event.venueName}
                  {event.venueAddress ? ` (${event.venueAddress})` : ''}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Right column: Price & Expand */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-sm md:text-base font-semibold text-[#f0ece0] whitespace-nowrap">
            {formatPrice(event.ticketPriceMinor, event.currency)}
          </span>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[#9b9583] hover:text-[#e0a72e] transition-colors"
            aria-expanded={expanded}
          >
            <span>{expanded ? 'Less' : 'Details'}</span>
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded details section */}
      {expanded && (
        <div className="mt-3.5 rounded-lg border border-[#33301f] bg-[#1e1b15] p-3.5 text-xs text-[#f0ece0]">
          {event.description && (
            <p className="mb-3 leading-relaxed text-[#f0ece0]/90 text-sm">
              {event.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#9b9583]">
            {event.capacity && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#e0a72e]" />
                <span>Capacity: <strong className="text-[#f0ece0]">{event.capacity.toLocaleString()}</strong> attendees</span>
              </div>
            )}
            {event.venueId && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#e0a72e]" />
                <span>Venue ID: <code className="font-mono text-[#f0ece0]">{event.venueId}</code></span>
              </div>
            )}
            {event.startTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#e0a72e]" />
                <span>Starts: <span className="text-[#f0ece0]">{new Date(event.startTime).toLocaleString()}</span></span>
              </div>
            )}
            {event.endTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#e0a72e]" />
                <span>Ends: <span className="text-[#f0ece0]">{new Date(event.endTime).toLocaleString()}</span></span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#33301f] flex items-center justify-between">
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-1 text-[11px] text-[#9b9583] hover:text-[#f0ece0]"
            >
              <Code className="h-3 w-3" />
              <span>{showJson ? 'Hide raw JSON' : 'Inspect raw JSON'}</span>
            </button>
            <span className="text-[11px] text-[#9b9583] font-mono">ID: {event.id}</span>
          </div>

          {showJson && (
            <pre className="mt-2.5 max-h-48 overflow-auto rounded bg-[#16140f] p-2.5 font-mono text-[11px] text-[#9b9583] border border-[#33301f]">
              {JSON.stringify(event, null, 2)}
            </pre>
          )}
        </div>
      )}
    </article>
  );
};
