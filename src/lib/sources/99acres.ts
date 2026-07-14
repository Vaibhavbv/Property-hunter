import { createAdapter } from "@/lib/sources/base";
import { SOURCES } from "@/config/sources";

// 99acres exposes an "Owner" posted-by filter; we request it and sort by the
// most recently posted so we only pay for the freshest listings.
export const nineacresAdapter = createAdapter({
  config: SOURCES["99acres"],
  buildInput: ({ cities, maxItems, ownerOnly }) => ({
    cities,
    listingTypes: ["rent", "sale"],
    postedBy: ownerOnly ? "owner" : "any",
    sortBy: "newest",
    maxItems,
  }),
});
