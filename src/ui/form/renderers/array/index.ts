import StringsRenderer, { tester as stringsTest } from "./StringsRenderer.vue";
import { registerEntry } from "../utils";
// -----------------------------------------------------------------------------

export const arrayRenderers = [registerEntry(StringsRenderer, stringsTest)];
