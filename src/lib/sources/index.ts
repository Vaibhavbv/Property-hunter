import type { SourceKey } from "@/lib/types";
import type { Adapter } from "@/lib/sources/base";
import { nobrokerAdapter } from "@/lib/sources/nobroker";
import { nineacresAdapter } from "@/lib/sources/99acres";
import { magicbricksAdapter } from "@/lib/sources/magicbricks";
import { housingAdapter } from "@/lib/sources/housing";

export const ADAPTERS: Record<SourceKey, Adapter> = {
  nobroker: nobrokerAdapter,
  "99acres": nineacresAdapter,
  magicbricks: magicbricksAdapter,
  housing: housingAdapter,
};
