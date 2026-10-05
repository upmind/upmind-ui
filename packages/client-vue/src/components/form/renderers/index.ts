import { registerEntry } from "@upmind/ui";
import EnumToggleGroupRenderer from "./EnumToggleGroupRenderer.vue";
import { tester as enumToggleGroupTest } from "./EnumToggleGroupRenderer.vue";

// -----------------------------------------------------------------------------

export const formRenderers = [
  registerEntry(EnumToggleGroupRenderer, enumToggleGroupTest)
];
