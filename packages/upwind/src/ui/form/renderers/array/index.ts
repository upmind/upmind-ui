import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import StringsRenderer, { tester as stringsTest } from "./StringsRenderer.vue";

export const arrayRenderers = [registerEntry(StringsRenderer, stringsTest)];
