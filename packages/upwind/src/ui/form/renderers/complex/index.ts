import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import ObjectRenderer, { tester as objectTest } from "./ObjectRenderer.vue";

export const complexRenderers = [registerEntry(ObjectRenderer, objectTest)];
