import React, { useState } from 'react';
import { EventItem, VenueItem } from '../types';
import { formatPrice, formatEventDateTime, getCategoryBadgeStyle, getStatusBadgeStyle } from '../utils/formatters';
import { X, Calendar, MapPin, Users, Phone, DollarSign, Copy, Check, Code, FileText } from 'lucide-react';

interface EventModalProps {
  event: EventItem | null;
  venue?: VenueItem;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, venue, onClose }) => {
  const [tab, setTab] = useState<'details' | 'json'>('details');
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const catStyle = getCategoryBadgeStyle(event.category);
  const statusStyle = getStatusBadgeStyle(event.status);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl bg-[#1e1b15] border border-[#33301f] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#33301f] flex items-start justify-between gap-4 bg-[#16140f]">
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider border"
                style={{
                  backgroundColor: catStyle.bg,
                  color: catStyle.text,
                  borderColor: catStyle.border,
                }}
              >
                {event.category || 'event'}
              </span>

              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.text,
                }}
              >
                {statusStyle.label}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#f0ece0] leading-snug">
              {event.title || 'Untitled event'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#9b9583] hover:text-[#f0ece0] hover:bg-[#33301f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#33301f] bg-[#16140f]/60 px-5 text-xs font-medium">
          <button
            onClick={() => setTab('details')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
              tab === 'details'
                ? 'border-[#e0a72e] text-[#e0a72e]'
                : 'border-transparent text-[#9b9583] hover:text-[#f0ece0]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Event Details</span>
          </button>
          <button
            onClick={() => setTab('json')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
              tab === 'json'
                ? 'border-[#e0a72e] text-[#e0a72e]'
                : 'border-transparent text-[#9b9583] hover:text-[#f0ece0]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw API Payload</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm text-[#f0ece0]">
          {tab === 'details' ? (
            <>
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#16140f] border border-[#33301f]">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#e0a72e] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[11px] text-[#9b9583] font-medium">Date & Time</div>
                    <div className="text-xs text-[#f0ece0] mt-0.5">
                      {formatEventDateTime(event.startTime, event.endTime)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <DollarSign className="w-4 h-4 text-[#e0a72e] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[11px] text-[#9b9583] font-medium">Ticket Price</div>
                    <div className="text-xs text-[#f0ece0] font-semibold mt-0.5">
                      {formatPrice(event.ticketPriceMinor, event.currency)}
                      {event.ticketPriceMinor ? (
                        <span className="text-[11px] font-normal text-[#9b9583] ml-1.5">
                          ({event.ticketPriceMinor.toLocaleString()} {event.currency || 'NGN'} minor)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {event.capacity && (
                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-[#e0a72e] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] text-[#9b9583] font-medium">Venue Capacity</div>
                      <div className="text-xs text-[#f0ece0] mt-0.5">
                        {event.capacity.toLocaleString()} attendees
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#e0a72e] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[11px] text-[#9b9583] font-medium">Venue Reference</div>
                    <div className="text-xs text-[#f0ece0] mt-0.5">
                      {venue ? venue.name : event.venueId || 'Unassigned'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-[#9b9583] uppercase tracking-wider">
                  Description
                </h4>
                <p className="text-sm text-[#d4cfbf] leading-relaxed whitespace-pre-line bg-[#16140f] p-3.5 rounded-lg border border-[#33301f]">
                  {event.description || 'No description provided for this event.'}
                </p>
              </div>

              {/* Venue details */}
              {venue && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-[#9b9583] uppercase tracking-wider">
                    Venue Details (Resolved from /api/venues)
                  </h4>
                  <div className="bg-[#16140f] p-3.5 rounded-lg border border-[#33301f] space-y-2 text-xs">
                    <div className="font-semibold text-sm text-[#f0ece0]">{venue.name}</div>
                    {venue.address && (
                      <div className="text-[#9b9583] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#e0a72e]" />
                        <span>{venue.address}, {venue.area || 'Abuja'}</span>
                      </div>
                    )}
                    {venue.contactInfo && (
                      <div className="text-[#9b9583] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#e0a72e]" />
                        <span>{venue.contactInfo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9b9583]">JSON Payload from API</span>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-[#16140f] border border-[#33301f] text-[#f0ece0] hover:border-[#e0a72e] transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-3 bg-[#16140f] border border-[#33301f] rounded-lg text-xs font-mono text-[#34d399] overflow-x-auto max-h-80">
                {JSON.stringify(event, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#33301f] bg-[#16140f] flex items-center justify-between text-xs text-[#9b9583]">
          <span className="font-mono text-[11px]">ID: {event.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#33301f] hover:bg-[#33301f]/80 text-[#f0ece0] font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
