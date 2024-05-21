import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import BooleanRenderer, { tester as booleanTest } from "./BooleanRenderer.vue";

import ButtonToggleRenderer, {
  tester as buttonToggleTest,
} from "./ButtonToggleRenderer.vue";

import DateRenderer, { tester as dateTest } from "./DateRenderer.vue";

import EmailRenderer, { tester as emailTest } from "./EmailRenderer.vue";

import EnumRenderer, { tester as enumTest } from "./EnumRenderer.vue";

import HiddenRenderer, { tester as hiddenTest } from "./ConstRenderer.vue";

import LookupRenderer, { tester as lookupTest } from "./LookupRenderer.vue";

import MultiStringRenderer, {
  tester as multiStringTest,
} from "./MultilineRenderer.vue";
import NumberRenderer, { tester as numberTest } from "./NumberRenderer.vue";

import OneOfRadioRenderer, {
  tester as oneOfRadioTest,
} from "./OneOfRadioRenderer.vue";
import OneOfRenderer, { tester as oneOfTest } from "./OneOfRenderer.vue";

import PasswordRenderer, {
  tester as passwordTest,
} from "./PasswordRenderer.vue";
import PhoneRenderer, { tester as phoneTest } from "./PhoneRenderer.vue";

import StringRenderer, { tester as stringTest } from "./StringRenderer.vue";

import UrlRenderer, { tester as urlTest } from "./UrlRenderer.vue";

// -----------------------------------------------------------------------------

export const controlRenderers = [
  registerEntry(BooleanRenderer, booleanTest),
  registerEntry(ButtonToggleRenderer, buttonToggleTest),
  registerEntry(DateRenderer, dateTest),
  registerEntry(EmailRenderer, emailTest),
  registerEntry(EnumRenderer, enumTest),
  registerEntry(HiddenRenderer, hiddenTest),
  registerEntry(LookupRenderer, lookupTest),
  registerEntry(MultiStringRenderer, multiStringTest),
  registerEntry(NumberRenderer, numberTest),
  registerEntry(OneOfRadioRenderer, oneOfRadioTest),
  registerEntry(OneOfRenderer, oneOfTest),
  registerEntry(PasswordRenderer, passwordTest),
  registerEntry(PhoneRenderer, phoneTest),
  registerEntry(StringRenderer, stringTest),
  registerEntry(UrlRenderer, urlTest),
];
