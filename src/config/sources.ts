import type { SourceKey } from "@/lib/types";

/**
 * Central place to tune scraping scope + spend. Everything that affects how
 * much Apify credit we burn lives here.
 *
 * COST NOTE ($5/month free tier ≈ $0.16/day):
 *  - Keep `enabled` sources few and `maxItems` small.
 *  - `maxItems` is the primary spend lever for pay-per-result actors.
 *  - Only the cities in TARGET_CITIES are scraped.
 *  - The cron runs once per day (see vercel.json).
 */

// Cities to scrape. Fewer cities = less credit spent.
export const TARGET_CITIES = ["Bangalore", "Pune"];

// Global cap per source per run. Overridable via env for quick tuning.
export const MAX_ITEMS_PER_SOURCE = Number(
  process.env.MAX_ITEMS_PER_SOURCE ?? 25
);

// When "1", the pipeline reads bundled fixtures instead of calling Apify.
export const USE_FIXTURES = process.env.USE_FIXTURES === "1";

export interface SourceConfig {
  key: SourceKey;
  label: string;
  enabled: boolean;
  /**
   * Apify actor id in "username/actor-name" form. These are placeholders for
   * well-known community actors — verify/replace with a free-to-use actor in
   * the Apify Store before running against real data. The adapter is what
   * shapes the input, so swapping the id here is usually all you need.
   */
  actorId: string;
  /**
   * Whether this portal is owner-only by nature (NoBroker) or needs an
   * owner filter applied in the adapter input (the rest).
   */
  ownerOnly: boolean;
}

export const SOURCES: Record<SourceKey, SourceConfig> = {
  nobroker: {
    key: "nobroker",
    label: "NoBroker",
    enabled: true,
    actorId: "apify/nobroker-scraper",
    ownerOnly: true,
  },
  "99acres": {
    key: "99acres",
    label: "99acres",
    enabled: true,
    actorId: "apify/99acres-scraper",
    ownerOnly: false,
  },
  magicbricks: {
    key: "magicbricks",
    label: "MagicBricks",
    enabled: true,
    actorId: "apify/magicbricks-scraper",
    ownerOnly: false,
  },
  housing: {
    key: "housing",
    label: "Housing.com",
    enabled: true,
    actorId: "apify/housing-scraper",
    ownerOnly: false,
  },
};

export const ENABLED_SOURCES = Object.values(SOURCES).filter((s) => s.enabled);
