import { createAdapter } from "@/lib/sources/base";
import { SOURCES } from "@/config/sources";

// NoBroker is owner-only by design. Config-driven; tune URLs in sources.ts.
export const nobrokerAdapter = createAdapter(SOURCES.nobroker);
