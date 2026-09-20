# Event Ticket & Attendee Checker

Check people who bought tickets for all events happening in Abuja (regardless of
sector) or for a single event, using live data from the **Abuja Events API**
(`https://events-api-a9et.onrender.com/api/v1`). Features attendee verification,
ticket quantities, check-in stats, CSV export, and cross-event attendee lookup.

## Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4
- **Backend:** Express 4 proxy server (Node.js)
- **Upstream data:** Abuja Events REST API on Render

## Why there is a backend proxy

The upstream Render API does **not** send CORS headers, so a browser calling it
directly gets blocked. The Express server in `server.ts` fetches from the
upstream on the server side (where CORS does not apply) and exposes the same
data under `/api/*`. It also adds an **in-memory cache** (25s default / 10min for
venues) to stay well under the upstream 100 req/min rate limit, plus timeouts
and graceful 502 errors when Render's free instance is cold-starting.

## Run locally

**Prereqs:** Node.js 20+

1. Install dependencies: `npm install`
2. Optional — configure environment:
   ```bash
   cp .env.example .env
   ```
   The app works with zero config; `.env` only overrides `PORT` /
   `UPSTREAM_API_BASE`.
3. Run: `npm run dev`
4. Open `http://localhost:3000`

## Environment variables

| Variable            | Default                                        | Description                                  |
| ------------------- | ---------------------------------------------- | -------------------------------------------- |
| `PORT`              | `3000`                                         | HTTP port the Express server binds           |
| `UPSTREAM_API_BASE` | `https://events-api-a9et.onrender.com/api/v1`  | Base URL of the Abuja Events upstream API    |
| `NODE_ENV`          | (unset → dev)                                  | `production` serves the compiled `dist/` build |

## Production build

```bash
npm run build     # vite build + esbuild server.ts -> dist/server.cjs
npm start         # node dist/server.cjs (serves dist/ as static files)
```

Note: `vite` is used only at build/dev time and is not required at runtime, so a
production install can use `npm install --omit=dev`.

## Deploy

### Option A — Render (recommended, same platform as the upstream)

1. Push this repo to GitHub.
2. In Render, **New → Blueprint**, select the repo. It auto-detects `render.yaml`
   and creates a free web service with the health check at `/api/health`.
3. Or manually: **New → Web Service**, build command
   `npm install && npm run build`, start command `npm start`, env
   `NODE_ENV=production`.

### Option B — Docker (Railway, Fly.io, any container host)

```bash
docker build -t event-checker .
docker run -p 3000:3000 -e NODE_ENV=production -e PORT=3000 event-checker
```

### Option C — any Node host

1. `npm install && npm run build`
2. `NODE_ENV=production PORT=3000 npm start`

## How the Abuja Events API was integrated

The app never calls the upstream API from the browser. The integration has three
layers:

### 1. Upstream REST endpoints (Render — read-only)

| Upstream endpoint                       | Purpose                          |
| --------------------------------------- | -------------------------------- |
| `GET /api/v1/events?limit&offset&category&sort&order` | Paginated event list |
| `GET /api/v1/events/:id`                | Single event detail              |
| `GET /api/v1/events/:id/tickets?limit&offset&status` | Ticket buyers for an event |
| `GET /api/v1/venues?limit=150`          | Venue names/addresses            |

The upstream is **read-only**, has no auth token, and is rate-limited to ~100
req/min.

### 2. Express proxy (`server.ts`)

Each proxy endpoint mirrors the upstream shape and adds `source: 'live'|'cache'`
and `corsProxied: true`:

| Proxy endpoint        | Backing upstream call                        | Caching        |
| --------------------- | -------------------------------------------- | -------------- |
| `GET /api/health`     | head ping to `/events?limit=1`               | —              |
| `GET /api/events`     | `GET /api/v1/events` (query passthrough)     | 25s            |
| `GET /api/events/:id` | `GET /api/v1/events/:id`                     | 25s            |
| `GET /api/events/:id/tickets` | `GET /api/v1/events/:id/tickets`     | 25s            |
| `GET /api/venues`     | `GET /api/v1/venues?limit=150`               | 10min          |
| `GET /api/all-events` | 2 upstream pages (173 events) merged         | 25s            |
| `GET /api/all-tickets`| fan-out tickets fetch across all events      | 25s            |

Key implementation details:

- Every fetch uses an `AbortController` timeout (8–12s) so a sleeping Render
  instance degrades to a JSON 502 rather than hanging the request.
- `getAllEventsMerged()` pages through upstream (`limit=100&offset=0` +
  `offset=100`) since a single page can't hold all 173 events.
- `GET /api/all-tickets` fans out ticket fetches with 12 concurrent workers and
  enriches each ticket with its `eventTitle`, `eventCategory`, and price.
- Cache keys cover the endpoint + query params, so per-event, per-category and
  page variants don't collide.

### 3. Frontend client (`src/api.ts`)

- Thin `fetch('/api/...')` wrappers: `fetchEvents`, `fetchEvent`,
  `fetchEventTickets`, `fetchAllEvents`, `fetchAllTickets`, `fetchHealth`,
  `fetchVenues`.
- Events are enriched client-side with venue names loaded from `/api/venues`
  (cached in a local `Map`).
- Every endpoint has a graceful fallback: upstream failure returns empty data +
  an `error` object (rendered as an error banner with a Retry button), and the
  events browser falls back to seeded sample data in `src/fallbackData.ts` when
  the proxy is unreachable.
- Ticket records are matched/linked back to their parent event by `eventId`, and
  check-in state is persisted in `localStorage` only.

### What is NOT in this integration

- No write/update calls to the upstream (it exposes none). Check-ins are local
  only by design.
- No auth, no API key — the upstream is a public read-only dataset.
- No Gemini/GEMINI usage — the `@google/genai` package and `metadata.json`
  reference is leftover from the project scaffold and is not used by any code.

## Project structure

```
├── server.ts              # Express proxy + dev (Vite) / prod (dist) serving
├── src/
│   ├── api.ts             # frontend fetch wrappers + fallbacks
│   ├── types.ts           # Event / Ticket / Venue / response types
│   ├── App.tsx            # views: event roster, events directory, global lookup
│   ├── services/          # alternate API client (kept for reference)
│   └── components/        # UI components
└── render.yaml            # Render Blueprint for one-click deploy
```
