import { ApifyClient } from "apify-client";

let client: ApifyClient | null = null;

function getClient(): ApifyClient {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error(
      "APIFY_TOKEN is not set. Set it in your env, or set USE_FIXTURES=1 to run without Apify."
    );
  }
  if (!client) client = new ApifyClient({ token });
  return client;
}

export interface ActorRunResult {
  items: Record<string, unknown>[];
  runId: string | null;
}

// Max run duration in seconds. Browser-based scrapers need real time to crawl,
// but this is also our hard ceiling on spend, so it's tunable via env.
// Default 420s (7 min) — enough for a small crawl, still bounded.
const ACTOR_TIMEOUT_SECS = Number(process.env.ACTOR_TIMEOUT_SECS ?? 420);

/**
 * Run an Apify actor synchronously and return its dataset items.
 *
 * Spend/time is bounded two ways:
 *  - `timeout` caps how long the run may execute (our ceiling on compute cost).
 *  - `maxItems` caps how many dataset items are produced/charged — for
 *    pay-per-result actors this is the primary cost lever, and most crawlers
 *    also treat it as a global limit, so the crawl finishes sooner.
 *
 * We do NOT pin `memory`: browser-based actors (Puppeteer/Playwright) need
 * several GB and will crawl slowly or fail if starved, so we let each actor use
 * its own recommended memory.
 */
export async function runActorAndGetItems(
  actorId: string,
  input: Record<string, unknown>,
  maxItems: number
): Promise<ActorRunResult> {
  const run = await getClient()
    .actor(actorId)
    .call(input, {
      timeout: ACTOR_TIMEOUT_SECS,
      maxItems,
    });

  const { items } = await getClient()
    .dataset(run.defaultDatasetId)
    .listItems({ limit: maxItems });

  // A timed-out/failed run that produced nothing should surface as an error in
  // scrape_runs — not a silent "success, 0 items". If it produced partial data
  // before aborting, keep it.
  if (run.status !== "SUCCEEDED" && items.length === 0) {
    throw new Error(
      `actor run ${run.status} with 0 items (timeout ${ACTOR_TIMEOUT_SECS}s). ` +
        `Try raising ACTOR_TIMEOUT_SECS or narrowing searchUrls/maxItems.`
    );
  }

  return {
    items: items as Record<string, unknown>[],
    runId: run.id ?? null,
  };
}
