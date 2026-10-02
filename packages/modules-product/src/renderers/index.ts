// -----------------------------------------------------------------------------
/**
 * @module product/renderers
 * @description The two Upmind-domain form renderers this package owns.
 */
import { registerEntry } from "@upmind/ui";
import SubProductRenderer from "./SubProductRenderer.vue";
import { tester as subProductTester } from "./SubProductRenderer.vue";
import TermsRenderer from "./TermsRenderer.vue";
import { tester as termsTester } from "./TermsRenderer.vue";
import type { FormRendererEntry } from "@upmind-automation/foundation";

export const productRenderers: FormRendererEntry[] = [
  registerEntry(TermsRenderer, termsTester),
  registerEntry(SubProductRenderer, subProductTester)
];
