import { createAdapter } from "@/lib/sources/base";
import { SOURCES } from "@/config/sources";

// NoBroker is owner-only by design, so no owner filter is needed — we just
// pull the newest listings across our target cities for both rent and sale.
export const nobrokerAdapter = createAdapter({
  config: SOURCES.nobroker,
  buildInput: ({ cities, maxItems }) => ({
    cities,
    listingTypes: ["rent", "sale"],
    sortBy: "newest",
    maxItems,
  }),
});
