import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

// import ArrayRenderer, { tester as arrayTest } from "./Renderer.vue";
import StringRenderer, { tester as stringTest } from "./StringRenderer.vue";

export const arrayRenderers = [
  // registerEntry(ArrayRenderer, arrayTest),
  registerEntry(StringRenderer, stringTest),
];
