import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import StringRenderer, { tester as stringTest } from "./StringRenderer.vue";

export const arrayRenderers = [registerEntry(StringRenderer, stringTest)];
