import { createAdapter } from "@/lib/sources/base";
import { SOURCES } from "@/config/sources";

// Owner filtering is applied in code via normalizer classification.
export const magicbricksAdapter = createAdapter(SOURCES.magicbricks);
