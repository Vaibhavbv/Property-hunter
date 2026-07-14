import { createAdminClient } from "@/lib/supabase/admin";
import type { NormalizedListing, SourceKey } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface UpsertResult {
  found: number;
  inserted: number;
}

/**
 * Upsert a batch of listings for one source. Deduped on
 * (source, source_listing_id): existing rows get last_seen_at bumped, new rows
 * get first_seen_at = now() (that's what powers the "New today" view).
 *
 * We count "inserted" by diffing the set of ids present before vs after.
 */
export async function upsertListings(
  db: SupabaseClient,
  source: SourceKey,
  listings: NormalizedListing[]
): Promise<UpsertResult> {
  if (listings.length === 0) return { found: 0, inserted: 0 };

  const ids = listings.map((l) => l.source_listing_id);

  const { data: existing } = await db
    .from("properties")
    .select("source_listing_id")
    .eq("source", source)
    .in("source_listing_id", ids);

  const existingIds = new Set(
    (existing ?? []).map((r) => r.source_listing_id as string)
  );

  const now = new Date().toISOString();
  const rows = listings.map((l) => ({
    ...l,
    images: l.images,
    amenities: l.amenities,
    last_seen_at: now,
    is_active: true,
  }));

  const { error } = await db
    .from("properties")
    .upsert(rows, { onConflict: "source,source_listing_id" });

  if (error) throw new Error(`upsert failed for ${source}: ${error.message}`);

  const inserted = ids.filter((id) => !existingIds.has(id)).length;
  return { found: listings.length, inserted };
}

export interface RunLog {
  id: string;
}

export async function startRun(
  db: SupabaseClient,
  source: SourceKey
): Promise<string> {
  const { data, error } = await db
    .from("scrape_runs")
    .insert({ source, status: "running" })
    .select("id")
    .single();
  if (error) throw new Error(`could not start run log: ${error.message}`);
  return data.id as string;
}

export async function finishRun(
  db: SupabaseClient,
  runId: string,
  fields: {
    status: "success" | "error";
    items_found?: number;
    items_new?: number;
    error?: string | null;
    apify_run_id?: string | null;
  }
): Promise<void> {
  await db
    .from("scrape_runs")
    .update({ ...fields, finished_at: new Date().toISOString() })
    .eq("id", runId);
}

export { createAdminClient };
