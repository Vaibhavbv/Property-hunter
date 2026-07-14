import { createAdapter } from "@/lib/sources/base";
import { SOURCES } from "@/config/sources";

// Housing.com supports an "Owner" filter. Same newest-first, capped strategy.
export const housingAdapter = createAdapter({
  config: SOURCES.housing,
  buildInput: ({ cities, maxItems, ownerOnly }) => ({
    cities,
    listingTypes: ["rent", "sale"],
    postedBy: ownerOnly ? "owner" : "any",
    sortBy: "newest",
    maxItems,
  }),
});
