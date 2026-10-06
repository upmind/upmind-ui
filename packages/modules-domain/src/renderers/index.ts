// -----------------------------------------------------------------------------
/**
 * @module domain/renderers
 * @description The renderer entries this package offers through the form-renderer socket.
 */
import { registerEntry } from "@upmind/ui";
import DomainRenderer from "./DomainRenderer.vue";
import { tester as domainTester } from "./DomainRenderer.vue";
import SLDRenderer from "./SLDRenderer.vue";
import { tester as sldTester } from "./SLDRenderer.vue";
import type { FormRendererEntry } from "@upmind-automation/foundation";
// -----------------------------------------------------------------------------

export const domainRenderers: FormRendererEntry[] = [
  registerEntry(DomainRenderer, domainTester),
  registerEntry(SLDRenderer, sldTester)
];
