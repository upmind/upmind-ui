import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import StringRenderer, { tester as stringTest } from "./StringRenderer.vue";

import MultiStringRenderer, {
  tester as multiStringTest,
} from "./MultilineRenderer.vue";

import UrlRenderer, { tester as urlTest } from "./UrlRenderer.vue";

import EmailRenderer, { tester as emailTest } from "./EmailRenderer.vue";

import PasswordRenderer, {
  tester as passwordTest,
} from "./PasswordRenderer.vue";

import DateRenderer, { tester as dateTest } from "./DateRenderer.vue";

import NumberRenderer, { tester as numberTest } from "./NumberRenderer.vue";

import HiddenRenderer, { tester as hiddenTest } from "./ConstRenderer.vue";

import BooleanRenderer, { tester as booleanTest } from "./BooleanRenderer.vue";

import EnumRenderer, { tester as enumTest } from "./EnumRenderer.vue";

import OneOfRenderer, { tester as oneOfTest } from "./OneOfRenderer.vue";

import OneOfRadioRenderer, {
  tester as oneOfRadioTest,
} from "./OneOfRadioRenderer.vue";

// -----------------------------------------------------------------------------
// TODO

// import PhoneRenderer, {
//   tester as phoneTest,
// } from "./PhoneRenderer.vue";

// -----------------------------------------------------------------------------

export const controlRenderers = [
  registerEntry(StringRenderer, stringTest),
  registerEntry(MultiStringRenderer, multiStringTest),
  registerEntry(NumberRenderer, numberTest),
  registerEntry(UrlRenderer, urlTest),
  registerEntry(EmailRenderer, emailTest),
  registerEntry(PasswordRenderer, passwordTest),
  registerEntry(HiddenRenderer, hiddenTest),
  registerEntry(DateRenderer, dateTest),
  registerEntry(BooleanRenderer, booleanTest),
  registerEntry(EnumRenderer, enumTest),
  registerEntry(OneOfRenderer, oneOfTest),
  registerEntry(OneOfRadioRenderer, oneOfRadioTest),

  // -----------------------------------------------------------------------------
  // TODO
  // registerEntry(PhoneRenderer, phoneTest),
];
