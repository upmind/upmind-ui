import { registerEntry } from "../utils";

// -----------------------------------------------------------------------------

import StringRenderer, {
  tester as stringRendererTest,
} from "./string/Renderer.vue";

import MultiStringRenderer, {
  tester as multiStringRendererTest,
} from "./string/MultilineRenderer.vue";

import NumberRenderer, {
  tester as numberRendererTest,
} from "./number/Renderer.vue";

import UrlRenderer, { tester as urlRendererTest } from "./url/Renderer.vue";

import EmailRenderer, {
  tester as emailRendererTest,
} from "./email/Renderer.vue";

import PasswordRenderer, {
  tester as passwordRendererTest,
} from "./password/Renderer.vue";

import HiddenRenderer, {
  tester as hiddenRendererTest,
} from "./hidden/Renderer.vue";

import DateRenderer, { tester as dateRendererTest } from "./date/Renderer.vue";

import BooleanRenderer, {
  tester as booleanRendererTest,
} from "./boolean/Renderer.vue";

import EnumRenderer, { tester as enumRendererTest } from "./enum/Renderer.vue";

import OneOfRenderer, {
  tester as oneOfRendererTest,
} from "./oneOf/Renderer.vue";

import OneOfRadioRenderer, {
  tester as oneOfRadioRendererTest,
} from "./oneOf/RadioRenderer.vue";

// -----------------------------------------------------------------------------
// TODO

// import OneOfMenuRenderer, {
//   tester as oneOfMenuRendererTest,
// } from "./EnumOneOfMenuRenderer.vue";

// import PhoneRenderer, {
//   tester as phoneRendererTest,
// } from "./PhoneRenderer.vue";

// -----------------------------------------------------------------------------

export const controlRenderers = [
  registerEntry(StringRenderer, stringRendererTest),
  registerEntry(MultiStringRenderer, multiStringRendererTest),
  registerEntry(NumberRenderer, numberRendererTest),
  registerEntry(UrlRenderer, urlRendererTest),
  registerEntry(EmailRenderer, emailRendererTest),
  registerEntry(PasswordRenderer, passwordRendererTest),
  registerEntry(HiddenRenderer, hiddenRendererTest),
  registerEntry(DateRenderer, dateRendererTest),
  registerEntry(BooleanRenderer, booleanRendererTest),
  registerEntry(EnumRenderer, enumRendererTest),
  registerEntry(OneOfRenderer, oneOfRendererTest),
  registerEntry(OneOfRadioRenderer, oneOfRadioRendererTest),

  // -----------------------------------------------------------------------------
  // TODO
  // registerEntry(OneOfMenuRenderer, oneOfMenuRendererTest),
  // registerEntry(PhoneRenderer, phoneRendererTest),
];
