import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

export { default as LabelRenderer } from "./Renderer.vue";

import LabelRendererEntry, {
  tester as labelRendererTest,
} from "./Renderer.vue";

export const labelRenderers = [
  registerEntry(LabelRendererEntry, labelRendererTest),
];
