import { registerEntry } from "../utils/registerEntry";

// -----------------------------------------------------------------------------

export { default as ArrayListRenderer } from "./ArrayListRenderer.vue";

import ArrayRendererEntry, {
  tester as arrayRendererTest,
} from "./ArrayListRenderer.vue";

export const arrayRenderers = [
  registerEntry(ArrayRendererEntry, arrayRendererTest),
];
