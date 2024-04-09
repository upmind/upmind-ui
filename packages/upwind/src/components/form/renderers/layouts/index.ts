import { registerEntry } from "../utils/registerEntry";

// -----------------------------------------------------------------------------

export { default as LayoutRenderer } from "./LayoutRenderer.vue";
export { default as GroupRenderer } from "./GroupRenderer.vue";

import LayoutRendererEntry, {
  tester as layoutRendererTest,
} from "./LayoutRenderer.vue";

import GroupRendererEntry, {
  tester as groupRendererTest,
} from "./GroupRenderer.vue";

export const layoutRenderers = [
  registerEntry(LayoutRendererEntry, layoutRendererTest),
  registerEntry(GroupRendererEntry, groupRendererTest),
];
