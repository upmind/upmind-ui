import { registerEntry } from "../utils/registerEntry";

// -----------------------------------------------------------------------------

export { default as LabelRenderer } from "./LabelRenderer.vue";

import LabelRendererEntry, {
  tester as labelRendererTest,
} from "./LabelRenderer.vue";

export const labelRenderers = [
  registerEntry(LabelRendererEntry, labelRendererTest),
];
