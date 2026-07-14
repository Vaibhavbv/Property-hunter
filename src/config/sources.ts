import type { SourceKey } from "@/lib/types";

/**
 * Central place to tune scraping scope + spend. Everything that affects how
 * much Apify credit we burn lives here.
 *
 * COST NOTE ($5/month free tier ≈ $0.16/day):
 *  - Keep `enabled` sources few and `maxItems` small.
 *  - `maxItems` is the primary spend lever for pay-per-result actors.
 *  - Fewer `searchUrls` = less credit.
 *  - Scheduling is once/day via GitHub Actions (.github/workflows/daily-scrape.yml).
 *
 * DESIGN — URL-driven scraping:
 *  We feed each actor the portal's own search-result URLs (which encode the
 *  city + rent/sale). Owner-only filtering then happens in code via the
 *  normalizer's owner/broker classification (see src/lib/normalize.ts), so it
 *  keeps working even if a portal changes its filter query params.
 *
 *  To get a perfect URL: open the portal, apply City + "Owner" + sort by
 *  "Newest", copy the browser URL, and paste it below. The defaults here are
 *  best-effort starting points — expect to fine-tune them after the first run.
 */

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
  /** Apify actor id in "username/actor-name" form. */
  actorId: string;
  /**
   * The actor input field that takes the list of URLs. Most Apify actors use
   * "startUrls" (array of { url }). Some use "urls" or "queries" — check the
   * actor's Input tab and change this one value if needed.
   */
  inputField: string;
  /** Whether the actor wants URLs as objects ({url}) or plain strings. */
  urlAsObject: boolean;
  /** Portal is owner-only by nature (NoBroker) vs needs owner classification. */
  ownerOnly: boolean;
  /** Portal search-result URLs to scrape (city + rent/sale baked in). */
  searchUrls: string[];
  /** Extra static input passed to the actor (merged over the URLs + maxItems). */
  extraInput?: Record<string, unknown>;
}

/**
 * ACTOR STATUS (as of the first real run):
 *  - 99acres (easyapi/99acres-com-scraper): confirmed working, pay-per-result.
 *  - nobroker / magicbricks / housing (ecomscrape/*): these turned out to be
 *    RENTAL actors whose free trial has expired ("You must rent a paid Actor
 *    in order to run it"). Renting 3 actors would blow the $5/month budget,
 *    so they're disabled here rather than risk more failed/costly guesses.
 *    Apify's store pages block automated fetching, so re-enabling these needs
 *    a human to browse https://apify.com/store, search each portal name,
 *    filter Pricing → "Pay per result", and swap in the actorId (+ inputField
 *    if it differs from "startUrls") below. Then flip enabled back to true.
 */
export const SOURCES: Record<SourceKey, SourceConfig> = {
  nobroker: {
    key: "nobroker",
    label: "NoBroker",
    enabled: false, // rental actor, free trial expired — see note above
    actorId: "ecomscrape/nobroker-property-search-scraper",
    inputField: "startUrls",
    urlAsObject: true,
    ownerOnly: true, // NoBroker is owner-only by design
    searchUrls: [
      "https://www.nobroker.in/property/rent/bangalore/multiple",
      "https://www.nobroker.in/property/sale/bangalore/multiple",
      "https://www.nobroker.in/property/rent/pune/multiple",
      "https://www.nobroker.in/property/sale/pune/multiple",
    ],
  },
  "99acres": {
    key: "99acres",
    label: "99acres",
    enabled: true,
    actorId: "easyapi/99acres-com-scraper",
    inputField: "startUrls",
    urlAsObject: true,
    ownerOnly: false,
    searchUrls: [
      "https://www.99acres.com/rent-property-in-bangalore-ffid",
      "https://www.99acres.com/property-for-sale-in-bangalore-ffid",
      "https://www.99acres.com/rent-property-in-pune-ffid",
      "https://www.99acres.com/property-for-sale-in-pune-ffid",
    ],
  },
  magicbricks: {
    key: "magicbricks",
    label: "MagicBricks",
    enabled: false, // rental actor, free trial expired — see note above
    actorId: "ecomscrape/magicbricks-property-search-scraper",
    inputField: "startUrls",
    urlAsObject: true,
    ownerOnly: false,
    searchUrls: [
      "https://www.magicbricks.com/property-for-rent/residential-real-estate?cityName=Bangalore",
      "https://www.magicbricks.com/property-for-sale/residential-real-estate?cityName=Bangalore",
      "https://www.magicbricks.com/property-for-rent/residential-real-estate?cityName=Pune",
      "https://www.magicbricks.com/property-for-sale/residential-real-estate?cityName=Pune",
    ],
  },
  housing: {
    key: "housing",
    label: "Housing.com",
    enabled: false, // rental actor, free trial expired — see note above
    actorId: "ecomscrape/housing-property-search-scraper",
    inputField: "startUrls",
    urlAsObject: true,
    ownerOnly: false,
    searchUrls: [
      "https://housing.com/in/rent/flats-for-rent-in-bangalore",
      "https://housing.com/in/buy/flats-for-sale-in-bangalore",
      "https://housing.com/in/rent/flats-for-rent-in-pune",
      "https://housing.com/in/buy/flats-for-sale-in-pune",
    ],
  },
};

export const ENABLED_SOURCES = Object.values(SOURCES).filter((s) => s.enabled);
