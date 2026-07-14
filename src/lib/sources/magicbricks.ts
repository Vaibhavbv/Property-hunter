import { createAdapter } from "@/lib/sources/base";
import { SOURCES } from "@/config/sources";

// MagicBricks supports an "Owner" filter. Same newest-first, capped strategy.
export const magicbricksAdapter = createAdapter({
  config: SOURCES.magicbricks,
  buildInput: ({ cities, maxItems, ownerOnly }) => ({
    cities,
    listingTypes: ["rent", "sale"],
    postedBy: ownerOnly ? "owner" : "any",
    sortBy: "newest",
    maxItems,
  }),
});
