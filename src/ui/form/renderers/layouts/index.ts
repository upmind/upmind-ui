import { registerEntry } from "../utils";
// -----------------------------------------------------------------------------

export { default as LayoutRenderer } from "./LayoutRenderer.vue";
export { default as GroupRenderer } from "./GroupRenderer.vue";
export { default as DialogRenderer } from "./DialogRenderer.vue";
import TabRenderer, { tester as tabTest } from "./TabRenderer.vue";
import LayoutRendererEntry, {
  tester as layoutTest
} from "./LayoutRenderer.vue";
import GroupRendererEntry, { tester as groupTest } from "./GroupRenderer.vue";
import DialogRendererEntry, {
  tester as dialogTest
} from "./DialogRenderer.vue";

export const layoutRenderers = [
  registerEntry(LayoutRendererEntry, layoutTest),
  registerEntry(GroupRendererEntry, groupTest),
  registerEntry(DialogRendererEntry, dialogTest),
  registerEntry(TabRenderer, tabTest)
];
