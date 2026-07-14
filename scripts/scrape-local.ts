/**
 * Run the ingestion pipeline from the command line — handy for verifying the
 * normalizer + DB upsert without deploying or hitting the cron endpoint.
 *
 * Usage:
 *   USE_FIXTURES=1 npm run scrape:local     # no Apify credit spent
 *   npm run scrape:local                    # real Apify run (needs APIFY_TOKEN)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env/.env.local.
 */
import { ingestAll } from "@/lib/ingest";

async function main() {
  console.log("Starting ingestion...");
  const results = await ingestAll();
  console.table(results);
  const totalNew = results.reduce((n, r) => n + r.inserted, 0);
  console.log(`Done. ${totalNew} new listing(s) inserted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
