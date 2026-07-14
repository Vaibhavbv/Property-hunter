import { runActorAndGetItems } from "@/lib/apify";
import { loadFixture } from "@/lib/fixtures";
import {
  normalizeCommon,
  parsePostedAt,
  textMatchesSectors,
} from "@/lib/normalize";
import {
  MAX_ITEMS_PER_SOURCE,
  POSTED_WITHIN_HOURS,
  TARGET_SECTORS,
  USE_FIXTURES,
  type SourceConfig,
} from "@/config/sources";
import type { NormalizedListing } from "@/lib/types";

export interface FetchResult {
  listings: NormalizedListing[];
  apifyRunId: string | null;
}

/**
 * Build the Apify actor input from a source config. We pass the portal's
 * search-result URLs under whatever field the actor expects (default
 * "startUrls"), plus a maxItems cap to bound spend.
 */
function buildInput(config: SourceConfig, maxItems: number): Record<string, unknown> {
  const urls = config.urlAsObject
    ? config.searchUrls.map((url) => ({ url }))
    : config.searchUrls;

  return {
    [config.inputField]: urls,
    maxItems,
    maxRequestRetries: 2,
    ...config.extraInput,
  };
}

/**
 * Adapters are now fully config-driven: they build input from the source's
 * searchUrls, run the actor (or read a fixture), normalize, and owner-filter.
 */
export function createAdapter(config: SourceConfig) {
  return {
    key: config.key,
    async fetchListings(): Promise<FetchResult> {
      const maxItems = MAX_ITEMS_PER_SOURCE;

      let rawItems: Record<string, unknown>[];
      let apifyRunId: string | null = null;

      if (USE_FIXTURES) {
        rawItems = loadFixture(config.key).slice(0, maxItems);
      } else {
        const input = buildInput(config, maxItems);
        const result = await runActorAndGetItems(config.actorId, input, maxItems);
        rawItems = result.items;
        apifyRunId = result.runId;
      }

      const cutoff = Date.now() - POSTED_WITHIN_HOURS * 60 * 60 * 1000;

      const listings = rawItems
        .map((raw) => normalizeCommon(config.key, raw))
        // Owner filtering: we DROP listings explicitly labelled as broker/agent
        // and KEEP owner + unlabelled ("unknown") rows. This is deliberately
        // forgiving — many actors don't expose a clean posted-by flag, and a
        // strict `=== "owner"` filter would empty the site. NoBroker is
        // owner-only by nature anyway. Tighten to `=== "owner"` here once we've
        // confirmed a given actor reliably reports the poster type.
        .filter((l) => l.posted_by !== "broker")
        .filter((l) => l.url) // drop rows we couldn't even link back to
        // Location filter: keep only the wanted Gurgaon sectors. Skipped when
        // the source's URLs already restrict localities (config.urlsPreFiltered),
        // since the URL is authoritative and a text match could drop valid rows.
        .filter((l) =>
          config.urlsPreFiltered || TARGET_SECTORS.length === 0
            ? true
            : textMatchesSectors(
                [l.locality, l.title, l.description, l.city]
                  .filter(Boolean)
                  .join(" "),
                TARGET_SECTORS
              )
        )
        // Recency filter: drop listings we can tell were posted before the
        // cutoff. Listings with no determinable posted date are kept (the
        // "New today" dashboard view still bounds them by first-seen).
        .filter((l) => {
          const ts = parsePostedAt(l.raw as Record<string, unknown>);
          return ts === null || ts >= cutoff;
        });

      return { listings, apifyRunId };
    },
  };
}

export type Adapter = ReturnType<typeof createAdapter>;
