import { runActorAndGetItems } from "@/lib/apify";
import { loadFixture } from "@/lib/fixtures";
import { normalizeCommon } from "@/lib/normalize";
import {
  MAX_ITEMS_PER_SOURCE,
  TARGET_CITIES,
  USE_FIXTURES,
  type SourceConfig,
} from "@/config/sources";
import type { NormalizedListing } from "@/lib/types";

export interface FetchResult {
  listings: NormalizedListing[];
  apifyRunId: string | null;
}

/**
 * Every adapter is the same shape: build an actor input, run it (or read a
 * fixture), then normalize. Adapters differ only in how they build input and
 * (optionally) how they map raw rows, so we express them as this config.
 */
export interface AdapterSpec {
  config: SourceConfig;
  /** Build the Apify actor input for the given cities + item cap. */
  buildInput: (opts: {
    cities: string[];
    maxItems: number;
    ownerOnly: boolean;
  }) => Record<string, unknown>;
  /** Optional custom row mapper; defaults to normalizeCommon. */
  mapRow?: (raw: Record<string, unknown>) => NormalizedListing;
}

export function createAdapter(spec: AdapterSpec) {
  const { config } = spec;
  const map =
    spec.mapRow ?? ((raw: Record<string, unknown>) => normalizeCommon(config.key, raw));

  return {
    key: config.key,
    async fetchListings(): Promise<FetchResult> {
      const maxItems = MAX_ITEMS_PER_SOURCE;

      let rawItems: Record<string, unknown>[];
      let apifyRunId: string | null = null;

      if (USE_FIXTURES) {
        rawItems = loadFixture(config.key).slice(0, maxItems);
      } else {
        const input = spec.buildInput({
          cities: TARGET_CITIES,
          maxItems,
          ownerOnly: config.ownerOnly,
        });
        const result = await runActorAndGetItems(config.actorId, input, maxItems);
        rawItems = result.items;
        apifyRunId = result.runId;
      }

      const listings = rawItems
        .map(map)
        // Keep only owner-posted listings. NoBroker is owner-only, so its
        // "unknown" rows are treated as owners; for the rest we require an
        // explicit owner classification.
        .filter((l) =>
          config.ownerOnly ? l.posted_by !== "broker" : l.posted_by === "owner"
        )
        .filter((l) => l.url); // drop rows we couldn't even link back to

      return { listings, apifyRunId };
    },
  };
}

export type Adapter = ReturnType<typeof createAdapter>;
