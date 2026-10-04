import { registerEntry } from "@upmind/ui";
import LookupRenderer from "./LookupRenderer.vue";
import { tester as lookupTester } from "./LookupRenderer.vue";
import type { FormRendererEntry } from "./types";

export type { FormRendererEntry } from "./types";
export * from "./useFormRenderers";

export const foundationRenderers: FormRendererEntry[] = [
  registerEntry(LookupRenderer, lookupTester)
];
