import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import ConstRenderer, { tester as ConstTest } from "./StringRenderer.vue";
import StringRenderer, { tester as StringTest } from "./StringRenderer.vue";
import BooleanRenderer, { tester as BooleanTest } from "./BooleanRenderer.vue";
import BooleanSwitchRenderer, {
  tester as BooleanSwitchTest,
} from "./BooleanSwitchRenderer.vue";

// -----------------------------------------------------------------------------

export const controlRenderers = [
  registerEntry(ConstRenderer, ConstTest),
  registerEntry(StringRenderer, StringTest),
  registerEntry(BooleanRenderer, BooleanTest),
  registerEntry(BooleanSwitchRenderer, BooleanSwitchTest),
];
