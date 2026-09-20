export interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  category: 'concert' | 'comedy' | 'meetup' | 'market' | string;
  venueId?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  startTime: string;
  endTime?: string | null;
  ticketPriceMinor?: number | null;
  currency?: string | null;
  capacity?: number | null;
  status: 'upcoming' | 'completed' | 'cancelled' | string;
  createdAt?: string;
  updatedAt?: string;
}

export type AbujaEvent = EventItem;

export interface VenueItem {
  id: string;
  name: string;
  address?: string | null;
  area?: string | null;
  capacity?: number | null;
  contactInfo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type Venue = VenueItem;

export interface TicketItem {
  id: string;
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
  quantity: number;
  status: 'confirmed' | 'reserved' | 'cancelled' | string;
  purchasedAt: string;
  createdAt?: string;
  updatedAt?: string;
  // Client-side enriched
  eventTitle?: string;
  eventCategory?: string; // sector (concert, comedy, meetup, market)
  ticketPriceMinor?: number | null;
  currency?: string | null;
  venueName?: string | null;
  checkedIn?: boolean;
  checkedInAt?: string;
}

export interface SectorsBreakdown {
  market: number;
  concert: number;
  comedy: number;
  meetup: number;
  total: number;
}

export interface ApiMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface EventsResponse {
  data: EventItem[];
  meta: ApiMeta;
  source?: 'live' | 'cache' | 'fallback';
  corsProxied?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export type EventsApiResponse = EventsResponse;

export interface TicketsResponse {
  data: TicketItem[];
  meta: ApiMeta;
  source?: 'live' | 'cache' | 'fallback';
  corsProxied?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface VenuesResponse {
  data: VenueItem[];
  meta?: ApiMeta;
  error?: {
    code: string;
    message: string;
  };
}

export type VenuesApiResponse = VenuesResponse;

export interface ApiHealth {
  status: 'ok' | 'degraded' | 'checking';
  upstream: 'connected' | 'unreachable' | 'checking';
  upstreamStatus?: number;
  latencyMs?: number;
  error?: string;
  upstreamUrl: string;
}

export interface ApiDiagnosticInfo {
  status: 'online' | 'offline' | 'checking';
  latencyMs?: number;
  totalEvents?: number;
  lastTestedAt?: string;
  error?: string;
}

export type ConnectionMode = 'proxy' | 'direct' | 'cors-proxy';
