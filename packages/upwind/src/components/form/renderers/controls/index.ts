import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import StringRenderer, { tester as stringTest } from "./string/Renderer.vue";

import MultiStringRenderer, {
  tester as multiStringTest,
} from "./string/MultilineRenderer.vue";

import UrlRenderer, { tester as urlTest } from "./string/UrlRenderer.vue";

import EmailRenderer, { tester as emailTest } from "./string/EmailRenderer.vue";

import PasswordRenderer, {
  tester as passwordTest,
} from "./string/PasswordRenderer.vue";

import DateRenderer, { tester as dateTest } from "./string/DateRenderer.vue";

import NumberRenderer, { tester as numberTest } from "./number/Renderer.vue";

import HiddenRenderer, { tester as hiddenTest } from "./hidden/Renderer.vue";

import BooleanRenderer, { tester as booleanTest } from "./boolean/Renderer.vue";

import EnumRenderer, { tester as enumTest } from "./enum/Renderer.vue";

import OneOfRenderer, { tester as oneOfTest } from "./oneOf/Renderer.vue";

import OneOfRadioRenderer, {
  tester as oneOfRadioTest,
} from "./oneOf/RadioRenderer.vue";

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
