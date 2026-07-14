import { NextResponse, type NextRequest } from "next/server";
import { ingestAll } from "@/lib/ingest";

// Ingestion can take a while; give it room and never cache.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Daily scrape endpoint. Triggered by Vercel Cron (see vercel.json).
 *
 * Auth: requires `Authorization: Bearer $CRON_SECRET`. Vercel Cron sends this
 * automatically when CRON_SECRET is set as a project env var. You can also
 * trigger it manually with the same header for testing.
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const results = await ingestAll();
    const totalNew = results.reduce((n, r) => n + r.inserted, 0);
    return NextResponse.json({ ok: true, totalNew, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
