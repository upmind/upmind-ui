import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

// import ArrayRenderer, { tester as arrayRendererTest } from "./Renderer.vue";
import StringRenderer, {
  tester as stringRendererTest,
} from "./StringRenderer.vue";

export const arrayRenderers = [
  // registerEntry(ArrayRenderer, arrayRendererTest),
  registerEntry(StringRenderer, stringRendererTest),
];
