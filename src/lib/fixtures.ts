import type { SourceKey } from "@/lib/types";

import nobroker from "@/fixtures/nobroker.json";
import nineacres from "@/fixtures/99acres.json";
import magicbricks from "@/fixtures/magicbricks.json";
import housing from "@/fixtures/housing.json";

const FIXTURES: Record<SourceKey, Record<string, unknown>[]> = {
  nobroker: nobroker as Record<string, unknown>[],
  "99acres": nineacres as Record<string, unknown>[],
  magicbricks: magicbricks as Record<string, unknown>[],
  housing: housing as Record<string, unknown>[],
};

/** Return bundled raw rows for a source (used when USE_FIXTURES=1). */
export function loadFixture(source: SourceKey): Record<string, unknown>[] {
  return FIXTURES[source] ?? [];
}
