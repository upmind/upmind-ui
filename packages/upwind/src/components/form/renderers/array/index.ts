import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import ArrayRenderer, { tester as arrayRendererTest } from "./Renderer.vue";

export const arrayRenderers = [registerEntry(ArrayRenderer, arrayRendererTest)];
