import 'dotenv/config';
import express from 'express';
import path from 'path';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const UPSTREAM_API_BASE = process.env.UPSTREAM_API_BASE || 'https://events-api-a9et.onrender.com/api/v1';

app.use(express.json());

// In-memory cache to prevent hitting Render rate limit (100 req/min)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 25 * 1000; // 25s for events & tickets
const VENUES_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes for venues

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setInCache<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}

// 1. Health check & upstream diagnostics
app.get('/api/health', async (_req, res) => {
  const startTime = Date.now();
  let upstreamOnline = false;
  let upstreamLatency = 0;
  let errorDetail: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(`${UPSTREAM_API_BASE}/events?limit=1`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);
    upstreamLatency = Date.now() - startTime;
    upstreamOnline = resp.ok;
  } catch (err: any) {
    errorDetail = err.message || 'Upstream timeout or connection error';
  }

  res.json({
    status: 'ok',
    upstream: {
      url: UPSTREAM_API_BASE,
      online: upstreamOnline,
      latencyMs: upstreamLatency,
      corsProxied: true,
      error: errorDetail,
    },
    timestamp: new Date().toISOString(),
  });
});

// 2. Events proxy endpoint
app.get('/api/events', async (req, res) => {
  const limit = req.query.limit ? String(req.query.limit) : '20';
  const offset = req.query.offset ? String(req.query.offset) : '0';
  const category = req.query.category ? String(req.query.category) : '';
  const sort = req.query.sort ? String(req.query.sort) : '';
  const order = req.query.order ? String(req.query.order) : '';

  const cacheKey = `events:${limit}:${offset}:${category}:${sort}:${order}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({
      ...(cached as object),
      source: 'cache',
      corsProxied: true,
    });
  }

  const queryParams = new URLSearchParams();
  queryParams.set('limit', limit);
  queryParams.set('offset', offset);
  if (category && category !== 'all') {
    queryParams.set('category', category);
  }
  if (sort) queryParams.set('sort', sort);
  if (order) queryParams.set('order', order);

  const targetUrl = `${UPSTREAM_API_BASE}/events?${queryParams.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AbujaEventsProxy/1.0',
      },
    });
    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    setInCache(cacheKey, data);

    res.json({
      ...data,
      source: 'live',
      corsProxied: true,
    });
  } catch (err: any) {
    console.error('Error proxying events from upstream:', err);
    res.status(502).json({
      error: {
        code: 'UPSTREAM_FETCH_FAILED',
        message:
          'Could not reach upstream Render API. The free instance may be waking up from sleep, or experiencing network timeout.',
        originalError: err.message,
      },
    });
  }
});

// 3. Single Event details endpoint
app.get('/api/events/:id', async (req, res) => {
  const eventId = req.params.id;
  const cacheKey = `event:${eventId}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({
      ...(cached as object),
      source: 'cache',
      corsProxied: true,
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${UPSTREAM_API_BASE}/events/${encodeURIComponent(eventId)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    setInCache(cacheKey, data);
    res.json({
      ...data,
      source: 'live',
      corsProxied: true,
    });
  } catch (err: any) {
    res.status(502).json({
      error: {
        code: 'EVENT_FETCH_FAILED',
        message: 'Could not fetch event details from upstream API.',
        originalError: err.message,
      },
    });
  }
});

// 4. Event Tickets (People who bought tickets) endpoint
app.get('/api/events/:id/tickets', async (req, res) => {
  const eventId = req.params.id;
  const limit = req.query.limit ? String(req.query.limit) : '100';
  const offset = req.query.offset ? String(req.query.offset) : '0';
  const status = req.query.status ? String(req.query.status) : '';

  const cacheKey = `tickets:${eventId}:${limit}:${offset}:${status}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({
      ...(cached as object),
      source: 'cache',
      corsProxied: true,
    });
  }

  const queryParams = new URLSearchParams();
  queryParams.set('limit', limit);
  queryParams.set('offset', offset);
  if (status && status !== 'all') {
    queryParams.set('status', status);
  }

  const targetUrl = `${UPSTREAM_API_BASE}/events/${encodeURIComponent(eventId)}/tickets?${queryParams.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AbujaEventsProxy/1.0',
      },
    });
    clearTimeout(timeout);

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    setInCache(cacheKey, data);
    res.json({
      ...data,
      source: 'live',
      corsProxied: true,
    });
  } catch (err: any) {
    console.error('Error fetching tickets for event:', err);
    res.status(502).json({
      error: {
        code: 'TICKETS_FETCH_FAILED',
        message: 'Could not fetch ticket buyer list from upstream API.',
        originalError: err.message,
      },
    });
  }
});

// 5. Venues proxy endpoint with caching
app.get('/api/venues', async (_req, res) => {
  const cacheKey = 'venues:all';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < VENUES_CACHE_TTL_MS) {
    return res.json({
      ...(cached.data as object),
      source: 'cache',
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${UPSTREAM_API_BASE}/venues?limit=150`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json(await response.json());
    }

    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });

    res.json({
      ...data,
      source: 'live',
    });
  } catch (err: any) {
    console.error('Error proxying venues:', err);
    res.status(502).json({
      error: {
        code: 'VENUES_FETCH_FAILED',
        message: 'Could not fetch venues from upstream server.',
        originalError: err.message,
      },
    });
  }
});

// Helper to fetch all events across all sectors
async function getAllEventsMerged(): Promise<any[]> {
  const cacheKey = 'all_events_merged';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as any[];
  }

  try {
    // Upstream has 173 events, page size max is 100
    const [p1Res, p2Res] = await Promise.all([
      fetch(`${UPSTREAM_API_BASE}/events?limit=100&offset=0`, { headers: { Accept: 'application/json' } }),
      fetch(`${UPSTREAM_API_BASE}/events?limit=100&offset=100`, { headers: { Accept: 'application/json' } }),
    ]);

    const p1 = p1Res.ok ? await p1Res.json() : { data: [] };
    const p2 = p2Res.ok ? await p2Res.json() : { data: [] };

    const allEvents = [...(p1.data || []), ...(p2.data || [])];
    if (allEvents.length > 0) {
      cache.set(cacheKey, { data: allEvents, timestamp: Date.now() });
    }
    return allEvents;
  } catch (err) {
    console.error('Failed to fetch all events merged:', err);
    return [];
  }
}

// 6. Endpoint to fetch ALL events regardless of sector
app.get('/api/all-events', async (req, res) => {
  const category = req.query.category ? String(req.query.category) : '';
  const events = await getAllEventsMerged();

  let filtered = events;
  if (category && category !== 'all') {
    filtered = events.filter((e) => e.category === category);
  }

  res.json({
    data: filtered,
    meta: {
      total: filtered.length,
      limit: filtered.length,
      offset: 0,
      hasMore: false,
    },
    sectorsBreakdown: {
      market: events.filter((e) => e.category === 'market').length,
      concert: events.filter((e) => e.category === 'concert').length,
      comedy: events.filter((e) => e.category === 'comedy').length,
      meetup: events.filter((e) => e.category === 'meetup').length,
      total: events.length,
    },
    source: 'live',
    corsProxied: true,
  });
});

// 7. Endpoint to fetch tickets across ALL events regardless of sector
app.get('/api/all-tickets', async (req, res) => {
  const category = req.query.category ? String(req.query.category) : '';
  const cacheKey = `all_tickets:${category || 'all'}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json({
      ...(cached.data as object),
      source: 'cache',
      corsProxied: true,
    });
  }

  try {
    const events = await getAllEventsMerged();
    const targetEvents = category && category !== 'all' ? events.filter((e) => e.category === category) : events;

    const allTickets: any[] = [];
    const concurrency = 12;
    let index = 0;

    async function worker() {
      while (index < targetEvents.length) {
        const i = index++;
        const ev = targetEvents[i];
        if (!ev) break;

        const ticketCacheKey = `tickets:${ev.id}:100:0:`;
        const cachedTicket = getFromCache(ticketCacheKey) as any;
        if (cachedTicket && Array.isArray(cachedTicket.data)) {
          for (const t of cachedTicket.data) {
            allTickets.push({
              ...t,
              eventTitle: ev.title,
              eventCategory: ev.category,
              ticketPriceMinor: ev.ticketPriceMinor,
              currency: ev.currency || 'NGN',
            });
          }
          continue;
        }

        try {
          const resp = await fetch(`${UPSTREAM_API_BASE}/events/${encodeURIComponent(ev.id)}/tickets?limit=100`, {
            headers: { Accept: 'application/json' },
          });
          if (resp.ok) {
            const data = await resp.json();
            const tickets = data.data || [];
            setInCache(ticketCacheKey, data);
            for (const t of tickets) {
              allTickets.push({
                ...t,
                eventTitle: ev.title,
                eventCategory: ev.category,
                ticketPriceMinor: ev.ticketPriceMinor,
                currency: ev.currency || 'NGN',
              });
            }
          }
        } catch {
          // ignore single event failure
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    const responsePayload = {
      data: allTickets,
      meta: {
        total: allTickets.length,
        eventsScanned: targetEvents.length,
        totalEventsInSystem: events.length,
      },
      source: 'live',
      corsProxied: true,
    };

    cache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });
    res.json(responsePayload);
  } catch (err: any) {
    console.error('Error fetching all tickets:', err);
    res.status(500).json({
      error: {
        code: 'ALL_TICKETS_FETCH_FAILED',
        message: 'Failed to aggregate tickets across all events.',
        originalError: err.message,
      },
    });
  }
});

// 6. Vite middleware (development) or static files (production)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // vite is a devDependency — only import it in dev so production
    // installs (npm ci --omit=dev) don't need it at runtime.
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
