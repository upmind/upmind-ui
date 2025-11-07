import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import ConstRenderer, { tester as ConstTest } from "./StringRenderer.vue";
import StringRenderer, { tester as StringTest } from "./StringRenderer.vue";
import BooleanRenderer, { tester as BooleanTest } from "./BooleanRenderer.vue";
import BooleanSwitchRenderer, {
  tester as BooleanSwitchTest
} from "./BooleanSwitchRenderer.vue";
import ButtonToggleRenderer, {
  tester as ButtonToggleTest
} from "./ButtonToggleRenderer.vue";
import PasswordRenderer, {
  tester as PasswordTest
} from "./PasswordRenderer.vue";
import NumberRenderer, { tester as NumberTest } from "./NumberRenderer.vue";
import EnumRenderer, { tester as EnumTest } from "./EnumRenderer.vue";
import EnumRadioRenderer, {
  tester as EnumRadioTest
} from "./EnumRadioRenderer.vue";
import UrlRenderer, { tester as UrlTest } from "./UrlRenderer.vue";
import EmailRenderer, { tester as EmailTest } from "./EmailRenderer.vue";
import PhoneRenderer, { tester as PhoneTest } from "./PhoneRenderer.vue";
import DateRenderer, { tester as DateTest } from "./DateRenderer.vue";
import MultilineRenderer, {
  tester as MultilineTest
} from "./MultilineRenderer.vue";
import OneOfRadioRenderer, {
  tester as OneOfRadioTest
} from "./OneOfRadioRenderer.vue";
import OneOfSelectRenderer, {
  tester as OneOfSelectTest
} from "./OneOfSelectRenderer.vue";
import LookupRenderer, { tester as lookupTest } from "./LookupRenderer.vue";
import CurrencyRenderer, {
  tester as CurrencyTest
} from "./CurrencyRenderer.vue";

// -----------------------------------------------------------------------------

export const controlRenderers = [
  registerEntry(ConstRenderer, ConstTest),
  registerEntry(StringRenderer, StringTest),
  registerEntry(BooleanRenderer, BooleanTest),
  registerEntry(BooleanSwitchRenderer, BooleanSwitchTest),
  registerEntry(ButtonToggleRenderer, ButtonToggleTest),
  registerEntry(CurrencyRenderer, CurrencyTest),
  registerEntry(NumberRenderer, NumberTest),
  registerEntry(EnumRenderer, EnumTest),
  registerEntry(EnumRadioRenderer, EnumRadioTest),
  registerEntry(PasswordRenderer, PasswordTest),
  registerEntry(UrlRenderer, UrlTest),
  registerEntry(EmailRenderer, EmailTest),
  registerEntry(PhoneRenderer, PhoneTest),
  registerEntry(DateRenderer, DateTest),
  registerEntry(OneOfRadioRenderer, OneOfRadioTest),
  registerEntry(OneOfSelectRenderer, OneOfSelectTest),
  registerEntry(MultilineRenderer, MultilineTest),
  registerEntry(LookupRenderer, lookupTest)
];
