import { EventItem, VenueItem, EventsResponse, TicketsResponse, ApiHealth } from '../types';

export const DIRECT_API_URL = 'https://events-api-a9et.onrender.com/api/v1';

export async function fetchHealth(): Promise<ApiHealth> {
  const start = Date.now();
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      return {
        status: data.upstream?.online ? 'ok' : 'degraded',
        upstream: data.upstream?.online ? 'connected' : 'unreachable',
        upstreamStatus: res.status,
        latencyMs: data.upstream?.latencyMs || Date.now() - start,
        upstreamUrl: data.upstream?.url || DIRECT_API_URL,
        error: data.upstream?.error || undefined,
      };
    }
  } catch (err: any) {
    //
  }

  return {
    status: 'degraded',
    upstream: 'unreachable',
    latencyMs: Date.now() - start,
    upstreamUrl: DIRECT_API_URL,
    error: 'Backend proxy unreachable',
  };
}

export async function fetchVenues(): Promise<Map<string, VenueItem>> {
  const map = new Map<string, VenueItem>();
  try {
    const res = await fetch('/api/venues');
    if (!res.ok) return map;
    const json = await res.json();
    const items: VenueItem[] = json.data || [];
    for (const v of items) {
      map.set(v.id, v);
    }
  } catch (err) {
    console.warn('Could not fetch venues mapping:', err);
  }
  return map;
}

export interface FetchEventsParams {
  limit?: number;
  offset?: number;
  category?: string;
}

export async function fetchEvents(params: FetchEventsParams = {}): Promise<EventsResponse> {
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  const query = new URLSearchParams();
  query.set('limit', String(limit));
  query.set('offset', String(offset));
  if (params.category && params.category !== 'all') {
    query.set('category', params.category);
  }

  try {
    const res = await fetch(`/api/events?${query.toString()}`);
    const json = await res.json();
    if (!res.ok) {
      return {
        data: [],
        meta: { total: 0, limit, offset, hasMore: false },
        error: json.error || { code: `HTTP_${res.status}`, message: 'Failed to fetch events' },
      };
    }
    return json;
  } catch (err: any) {
    return {
      data: [],
      meta: { total: 0, limit, offset, hasMore: false },
      error: {
        code: 'FETCH_ERROR',
        message: err.message || 'Could not connect to events API',
      },
    };
  }
}

export async function fetchEvent(id: string): Promise<EventItem | null> {
  try {
    const res = await fetch(`/api/events/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error fetching event details:', err);
    return null;
  }
}

export interface FetchTicketsParams {
  limit?: number;
  offset?: number;
  status?: string;
}

export async function fetchEventTickets(eventId: string, params: FetchTicketsParams = {}): Promise<TicketsResponse> {
  const limit = params.limit ?? 100;
  const offset = params.offset ?? 0;
  const query = new URLSearchParams();
  query.set('limit', String(limit));
  query.set('offset', String(offset));
  if (params.status && params.status !== 'all') {
    query.set('status', params.status);
  }

  try {
    const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/tickets?${query.toString()}`);
    const json = await res.json();
    if (!res.ok) {
      return {
        data: [],
        meta: { total: 0, limit, offset, hasMore: false },
        error: json.error || { code: `HTTP_${res.status}`, message: 'Failed to load tickets for this event' },
      };
    }
    return json;
  } catch (err: any) {
    return {
      data: [],
      meta: { total: 0, limit, offset, hasMore: false },
      error: {
        code: 'TICKETS_FETCH_ERROR',
        message: err.message || 'Could not retrieve ticket records',
      },
    };
  }
}
