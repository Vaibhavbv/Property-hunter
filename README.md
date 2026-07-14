# 🏠 Property Hunter

A private web dashboard that aggregates **owner-posted** property listings (rent
& sale) from Indian portals — **99acres, MagicBricks, Housing.com, NoBroker** —
and shows you **fresh listings every day**.

Built with **Next.js (App Router) + Supabase (Postgres)**, scraping via
**Apify** actors, deployed on **Vercel** with a daily cron.

---

## How it works

```
Apify actors (per portal)  ──►  /api/cron/scrape (Vercel Cron, daily 6am)
                                      │  normalize + owner-filter + dedupe
                                      ▼
                                Supabase Postgres  ──►  Next.js dashboard (login-gated)
```

- A **daily cron** hits `/api/cron/scrape`, which runs each enabled source's
  Apify actor (owner-filtered, newest-first, item-capped), normalizes the
  results, and **upserts** them into Postgres — deduped on
  `(source, source_listing_id)`.
- New rows get `first_seen_at = now()`, which powers the **"New today"** view.
- The dashboard is **private** (Supabase Auth); only you can log in.

---

## Cost control (fits the Apify $5/month free tier)

$5/month ≈ **$0.16/day**. Spend is bounded by, all in [`src/config/sources.ts`](src/config/sources.ts):

| Lever | Default | Effect |
|---|---|---|
| Cron frequency | once/day (`vercel.json`) | one run per source per day |
| `MAX_ITEMS_PER_SOURCE` | `25` (env-overridable) | primary spend lever — fewer results = less credit |
| `TARGET_CITIES` | `Bangalore`, `Pune` | fewer cities = less credit |
| Actor `timeout`/`memory` | 180s / 512MB ([`src/lib/apify.ts`](src/lib/apify.ts)) | caps compute units per run |

After your first real run, check the run's usage in the Apify console and lower
`MAX_ITEMS_PER_SOURCE` if the daily projection exceeds ~$0.16.

> ⚠️ The actor ids in `src/config/sources.ts` are **placeholders**. Before running
> against real data, pick a **free-to-use** (compute-only, no monthly rental fee)
> actor for each portal from the [Apify Store](https://apify.com/store) and update
> the `actorId` (and, if the actor's input schema differs, the `buildInput` in the
> matching `src/lib/sources/*.ts` adapter).

---

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in
   the SQL editor (creates tables, indexes, RLS).
3. **Authentication → Users → Add user**: create your single login (email + password).
4. Copy the URL, anon key, and service-role key from **Project Settings → API**.

### 2. Environment
```bash
cp .env.example .env.local
# fill in Supabase keys, APIFY_TOKEN, and a random CRON_SECRET
```

### 3. Install & run
```bash
npm install
npm run dev        # http://localhost:3000 → redirects to /login
```

---

## Populating listings

**Without spending Apify credit (fixtures):**
```bash
USE_FIXTURES=1 npx tsx --env-file=.env.local scripts/scrape-local.ts
```
This runs the full normalize → dedupe → upsert path using the bundled sample data
in `src/fixtures/`, so you can verify the DB and UI end-to-end for free.

**Real run (spends Apify credit):**
```bash
npx tsx --env-file=.env.local scripts/scrape-local.ts
```

**Via the cron endpoint (what Vercel calls daily):**
```bash
curl -X POST http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Deploy (Vercel)

1. Import the repo into Vercel.
2. Add the env vars from `.env.example` in **Project Settings → Environment Variables**
   (including `CRON_SECRET` — Vercel Cron automatically sends it as the bearer token).
3. Deploy. The cron in [`vercel.json`](vercel.json) runs `/api/cron/scrape` daily at 06:00 UTC.

---

## Project layout

| Path | Purpose |
|---|---|
| `src/config/sources.ts` | Per-portal actor ids + all spend controls |
| `src/lib/apify.ts` | Apify client wrapper (capped runs) |
| `src/lib/sources/*.ts` | One adapter per portal (owner-filtered input) |
| `src/lib/normalize.ts` | Raw actor output → normalized listing; owner/broker classification |
| `src/lib/db.ts` | Dedup upsert + `scrape_runs` logging |
| `src/lib/ingest.ts` | Orchestrates all sources |
| `src/app/api/cron/scrape/` | Daily ingestion endpoint (bearer-secret auth) |
| `src/app/page.tsx` | Dashboard: grid, filters, "New today" |
| `src/app/property/[id]/` | Listing detail |
| `supabase/migrations/` | DB schema |

---

## Notes

- **Private by design.** The middleware redirects unauthenticated users to `/login`;
  the ingestion writes with the service-role key server-side only.
- **Respect portal ToS.** This is a personal tool running once daily. Some portals
  gate owner phone numbers behind login — we store what the actor returns and always
  link back to the source listing.
- Secrets live only in env vars / Vercel settings and are never committed.
