import { registerEntry } from "../utils/registerEntry";

// -----------------------------------------------------------------------------

import StringControlRenderer, {
  tester as stringControlRendererTest,
} from "./string/Renderer.vue";

import MultiStringControlRenderer, {
  tester as multiStringControlRendererTest,
} from "./string/MultilineRenderer.vue";

import NumberControlRenderer, {
  tester as numberControlRendererTest,
} from "./number/Renderer.vue";

import UrlControlRenderer, {
  tester as urlControlRendererTest,
} from "./url/Renderer.vue";

import EmailControlRenderer, {
  tester as emailControlRendererTest,
} from "./email/Renderer.vue";

import PasswordControlRenderer, {
  tester as passwordControlRendererTest,
} from "./password/Renderer.vue";

import HiddenControlRenderer, {
  tester as hiddenControlRendererTest,
} from "./hidden/Renderer.vue";

import DateControlRenderer, {
  tester as dateControlRendererTest,
} from "./date/Renderer.vue";

import BooleanControlRenderer, {
  tester as booleanControlRendererTest,
} from "./boolean/Renderer.vue";

// -----------------------------------------------------------------------------
// TODO

import EnumControlRenderer, {
  tester as enumControlRendererTest,
} from "./EnumControlRenderer.vue";

import OneOfEnumControlRenderer, {
  tester as oneOfEnumControlRendererTest,
} from "./EnumOneOfControlRenderer.vue";

import OneOfEnumMenuControlRenderer, {
  tester as oneOfEnumMenuControlRendererTest,
} from "./EnumOneOfMenuControlRenderer.vue";

import OneOfEnumRadioControlRenderer, {
  tester as oneOfEnumRadioControlRendererTest,
} from "./EnumOneOfRadioControlRenderer.vue";

import PhoneControlRenderer, {
  tester as phoneControlRendererTest,
} from "./PhoneControlRenderer.vue";

// -----------------------------------------------------------------------------

export const controlRenderers = [
  registerEntry(StringControlRenderer, stringControlRendererTest),
  registerEntry(MultiStringControlRenderer, multiStringControlRendererTest),
  registerEntry(NumberControlRenderer, numberControlRendererTest),
  registerEntry(UrlControlRenderer, urlControlRendererTest),
  registerEntry(EmailControlRenderer, emailControlRendererTest),
  registerEntry(PasswordControlRenderer, passwordControlRendererTest),
  registerEntry(HiddenControlRenderer, hiddenControlRendererTest),
  registerEntry(DateControlRenderer, dateControlRendererTest),
  registerEntry(BooleanControlRenderer, booleanControlRendererTest),

  // -----------------------------------------------------------------------------
  registerEntry(EnumControlRenderer, enumControlRendererTest),
  registerEntry(OneOfEnumControlRenderer, oneOfEnumControlRendererTest),
  registerEntry(OneOfEnumMenuControlRenderer, oneOfEnumMenuControlRendererTest),
  registerEntry(
    OneOfEnumRadioControlRenderer,
    oneOfEnumRadioControlRendererTest
  ),
  registerEntry(PhoneControlRenderer, phoneControlRendererTest),
];
