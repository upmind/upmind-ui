import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

export { default as LabelRenderer } from "./LabelRenderer.vue";

import LabelRendererEntry, { tester as labelTest } from "./LabelRenderer.vue";

export const labelRenderers = [registerEntry(LabelRendererEntry, labelTest)];
