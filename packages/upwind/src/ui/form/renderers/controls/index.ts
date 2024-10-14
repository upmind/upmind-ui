import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import ConstRenderer, { tester as ConstTest } from "./StringRenderer.vue";
import StringRenderer, { tester as StringTest } from "./StringRenderer.vue";
import BooleanRenderer, { tester as BooleanTest } from "./BooleanRenderer.vue";
import BooleanSwitchRenderer, {
  tester as BooleanSwitchTest,
} from "./BooleanSwitchRenderer.vue";
import ButtonToggleRenderer, {
  tester as ButtonToggleTest,
} from "./ButtonToggleRenderer.vue";
import PasswordRenderer, {
  tester as PasswordTest,
} from "./PasswordRenderer.vue";
import NumberRenderer, { tester as NumberTest } from "./NumberRenderer.vue";
import EnumRenderer, { tester as EnumTest } from "./EnumRenderer.vue";

// -----------------------------------------------------------------------------

export const controlRenderers = [
  registerEntry(ConstRenderer, ConstTest),
  registerEntry(StringRenderer, StringTest),
  registerEntry(BooleanRenderer, BooleanTest),
  registerEntry(BooleanSwitchRenderer, BooleanSwitchTest),
  registerEntry(ButtonToggleRenderer, ButtonToggleTest),
  registerEntry(NumberRenderer, NumberTest),
  registerEntry(EnumRenderer, EnumTest),
  registerEntry(PasswordRenderer, PasswordTest),
];
