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

/**
 * Run an Apify actor synchronously and return its dataset items. We cap the
 * run with `maxItems` and a timeout so a misbehaving actor can't quietly burn
 * the whole month's credit.
 */
export async function runActorAndGetItems(
  actorId: string,
  input: Record<string, unknown>,
  maxItems: number
): Promise<ActorRunResult> {
  const run = await getClient()
    .actor(actorId)
    .call(input, {
      // Hard ceiling on compute so a stuck run can't drain credit.
      timeout: 180, // seconds
      memory: 512, // MB — smaller memory = fewer compute units billed
    });

  const { items } = await getClient()
    .dataset(run.defaultDatasetId)
    .listItems({ limit: maxItems });

  return {
    items: items as Record<string, unknown>[],
    runId: run.id ?? null,
  };
}
