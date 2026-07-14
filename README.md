# 🏠 Property Hunter

A private web dashboard that aggregates **owner-posted** property listings (rent
& sale) from Indian portals — **99acres, MagicBricks, Housing.com, NoBroker** —
and shows you **fresh listings every day**.

Built with **Next.js (App Router) + Supabase (Postgres)**, scraping via
**Apify** actors, deployed on **Vercel**, and scheduled daily by a **GitHub
Actions** workflow.

---

## How it works

```
Apify actors (per portal)  ──►  /api/cron/scrape  ◄── GitHub Actions (daily 6am UTC)
                                      │  normalize + owner-filter + dedupe
                                      ▼
                                Supabase Postgres  ──►  Next.js dashboard (login-gated)
```

- A **GitHub Actions** workflow ([`.github/workflows/daily-scrape.yml`](.github/workflows/daily-scrape.yml))
  runs once a day and calls `/api/cron/scrape`, which runs each enabled source's
  Apify actor (URL-driven, item-capped), normalizes the results, filters out
  broker listings, and **upserts** them into Postgres — deduped on
  `(source, source_listing_id)`.
- New rows get `first_seen_at = now()`, which powers the **"New today"** view.
- The dashboard is **private** (Supabase Auth); only you can log in.

---

## Cost control (fits the Apify $5/month free tier)

$5/month ≈ **$0.16/day**. Spend is bounded by, all in [`src/config/sources.ts`](src/config/sources.ts):

| Lever | Default | Effect |
|---|---|---|
| Schedule | once/day (GitHub Actions) | one run per source per day |
| `MAX_ITEMS_PER_SOURCE` | `25` (env-overridable) | primary spend lever — fewer results = less credit |
| `searchUrls` per source | 4 (2 cities × rent/sale) | fewer URLs = less credit |
| Actor `timeout`/`memory` | 180s / 512MB ([`src/lib/apify.ts`](src/lib/apify.ts)) | caps compute units per run |

After your first real run, check the run's usage in the Apify console and lower
`MAX_ITEMS_PER_SOURCE` if the daily projection exceeds ~$0.16.

> ℹ️ **Actors & search URLs.** [`src/config/sources.ts`](src/config/sources.ts)
> ships with concrete pay-per-result actors (`ecomscrape/*`, `easyapi/*`) and
> best-effort portal search URLs. Because each portal's URL format and each
> actor's output shape can vary, expect to fine-tune the `searchUrls` (and
> possibly `inputField`) once, after inspecting the first real run's output. The
> normalizer ([`src/lib/normalize.ts`](src/lib/normalize.ts)) is intentionally
> forgiving about field names to smooth this over.

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

**Via the scrape endpoint (what GitHub Actions calls daily):**
```bash
curl -X POST http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Deploy (Vercel) + schedule (GitHub Actions)

### Deploy the site
1. Import the repo into Vercel.
2. Add the env vars from `.env.example` in **Project Settings → Environment Variables**
   (Supabase keys, `APIFY_TOKEN`, and a random `CRON_SECRET`). Set `USE_FIXTURES=1`
   first to confirm the site works with sample data, then remove it (or set `0`)
   for real scraping.
3. Deploy. Note your live URL, e.g. `https://property-hunter-xyz.vercel.app`.

### Schedule the daily scrape (GitHub Actions)
The workflow [`.github/workflows/daily-scrape.yml`](.github/workflows/daily-scrape.yml)
runs daily and can also be triggered manually. Add two **repository secrets** under
**GitHub → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `SITE_URL` | your Vercel URL, no trailing slash |
| `CRON_SECRET` | the same value you set in Vercel |

Then **Actions → Daily property scrape → Run workflow** to trigger the first
scrape immediately (instead of waiting for 6 AM UTC). New listings appear on the
site under "New today".

---

## Project layout

| Path | Purpose |
|---|---|
| `src/config/sources.ts` | Per-portal actor ids, search URLs + all spend controls |
| `src/lib/apify.ts` | Apify client wrapper (capped runs) |
| `src/lib/sources/*.ts` | One config-driven adapter per portal |
| `src/lib/normalize.ts` | Raw actor output → normalized listing; owner/broker classification |
| `src/lib/db.ts` | Dedup upsert + `scrape_runs` logging |
| `src/lib/ingest.ts` | Orchestrates all sources |
| `src/app/api/cron/scrape/` | Ingestion endpoint (bearer-secret auth) |
| `.github/workflows/daily-scrape.yml` | Daily schedule that calls the endpoint |
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
- Secrets live only in env vars / Vercel settings / GitHub Actions secrets and
  are never committed.
