import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import ConstRenderer, { tester as ConstTest } from "./StringRenderer.vue";
import StringRenderer, { tester as StringTest } from "./StringRenderer.vue";

// -----------------------------------------------------------------------------

export const controlRenderers = [
  registerEntry(ConstRenderer, ConstTest),
  registerEntry(StringRenderer, StringTest),
];
