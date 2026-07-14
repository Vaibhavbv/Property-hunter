import { runActorAndGetItems } from "@/lib/apify";
import { loadFixture } from "@/lib/fixtures";
import { normalizeCommon } from "@/lib/normalize";
import {
  MAX_ITEMS_PER_SOURCE,
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

      const listings = rawItems
        .map((raw) => normalizeCommon(config.key, raw))
        // Owner filtering: we DROP listings explicitly labelled as broker/agent
        // and KEEP owner + unlabelled ("unknown") rows. This is deliberately
        // forgiving — many actors don't expose a clean posted-by flag, and a
        // strict `=== "owner"` filter would empty the site. NoBroker is
        // owner-only by nature anyway. Tighten to `=== "owner"` here once we've
        // confirmed a given actor reliably reports the poster type.
        .filter((l) => l.posted_by !== "broker")
        .filter((l) => l.url); // drop rows we couldn't even link back to

      return { listings, apifyRunId };
    },
  };
}

export type Adapter = ReturnType<typeof createAdapter>;
