import LabelRendererEntry, { tester as labelTest } from "./LabelRenderer.vue";
import { registerEntry } from "../utils";
// -----------------------------------------------------------------------------

export { default as LabelRenderer } from "./LabelRenderer.vue";

export const labelRenderers = [registerEntry(LabelRendererEntry, labelTest)];
