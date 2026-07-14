import { ENABLED_SOURCES } from "@/config/sources";
import { ADAPTERS } from "@/lib/sources";
import {
  createAdminClient,
  finishRun,
  startRun,
  upsertListings,
} from "@/lib/db";

export interface SourceIngestResult {
  source: string;
  found: number;
  inserted: number;
  status: "success" | "error";
  error?: string;
}

/**
 * Run every enabled source, upsert its listings, and log each run. One source
 * failing does not abort the others — the daily job is best-effort.
 */
export async function ingestAll(): Promise<SourceIngestResult[]> {
  const db = createAdminClient();
  const results: SourceIngestResult[] = [];

  for (const source of ENABLED_SOURCES) {
    const runId = await startRun(db, source.key);
    try {
      const adapter = ADAPTERS[source.key];
      const { listings, apifyRunId } = await adapter.fetchListings();
      const { found, inserted } = await upsertListings(db, source.key, listings);

      await finishRun(db, runId, {
        status: "success",
        items_found: found,
        items_new: inserted,
        apify_run_id: apifyRunId,
      });
      results.push({ source: source.key, found, inserted, status: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await finishRun(db, runId, { status: "error", error: message });
      results.push({
        source: source.key,
        found: 0,
        inserted: 0,
        status: "error",
        error: message,
      });
    }
  }

  return results;
}
