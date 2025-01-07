import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

export { default as LayoutRenderer } from "./LayoutRenderer.vue";
export { default as GroupRenderer } from "./GroupRenderer.vue";

import LayoutRendererEntry, {
  tester as layoutTest,
} from "./LayoutRenderer.vue";

import GroupRendererEntry, { tester as groupTest } from "./GroupRenderer.vue";

export const layoutRenderers = [
  registerEntry(LayoutRendererEntry, layoutTest),
  registerEntry(GroupRendererEntry, groupTest),
];
