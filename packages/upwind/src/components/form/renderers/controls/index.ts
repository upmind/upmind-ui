import { registerEntry } from "../utils/registerEntry";
// -----------------------------------------------------------------------------

export { default as ControlWrapper } from "./wrapper/Wrapper.vue";
export { default as StringControlRenderer } from "./string/Renderer.vue";
export { default as MultiStringControlRenderer } from "./string/MultilineRenderer.vue";
export { default as NumberControlRenderer } from "./number/Renderer.vue";
export { default as UrlControlRenderer } from "./url/Renderer.vue";
export { default as EmailControlRenderer } from "./email/Renderer.vue";
export { default as PasswordControlRenderer } from "./password/Renderer.vue";
export { default as HiddenControlRenderer } from "./hidden/Renderer.vue";
// -----------------------------------------------------------------------------
export { default as EnumControlRenderer } from "./EnumControlRenderer.vue";
export { default as oneOfEnumControlRenderer } from "./EnumOneOfControlRenderer.vue";
export { default as oneOfEnumMenuControlRenderer } from "./EnumOneOfMenuControlRenderer.vue";
export { default as oneOfEnumRadioControlRenderer } from "./EnumOneOfRadioControlRenderer.vue";
export { default as DateControlRenderer } from "./DateControlRenderer.vue";
export { default as TimeControlRenderer } from "./TimeControlRenderer.vue";
export { default as BooleanControlRenderer } from "./BooleanControlRenderer.vue";
export { default as PhoneControlRenderer } from "./PhoneControlRenderer.vue";

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

import DateControlRenderer, {
  tester as dateControlRendererTest,
} from "./DateControlRenderer.vue";

import TimeControlRenderer, {
  tester as timeControlRendererTest,
} from "./TimeControlRenderer.vue";

import BooleanControlRenderer, {
  tester as booleanControlRendererTest,
} from "./BooleanControlRenderer.vue";

import PhoneControlRenderer, {
  tester as phoneControlRendererTest,
} from "./PhoneControlRenderer.vue";

export const controlRenderers = [
  registerEntry(StringControlRenderer, stringControlRendererTest),
  registerEntry(MultiStringControlRenderer, multiStringControlRendererTest),
  registerEntry(NumberControlRenderer, numberControlRendererTest),
  registerEntry(UrlControlRenderer, urlControlRendererTest),
  registerEntry(EmailControlRenderer, emailControlRendererTest),
  registerEntry(PasswordControlRenderer, passwordControlRendererTest),
  registerEntry(HiddenControlRenderer, hiddenControlRendererTest),

  // -----------------------------------------------------------------------------
  registerEntry(EnumControlRenderer, enumControlRendererTest),
  registerEntry(OneOfEnumControlRenderer, oneOfEnumControlRendererTest),
  registerEntry(OneOfEnumMenuControlRenderer, oneOfEnumMenuControlRendererTest),
  registerEntry(
    OneOfEnumRadioControlRenderer,
    oneOfEnumRadioControlRendererTest
  ),
  registerEntry(DateControlRenderer, dateControlRendererTest),
  registerEntry(TimeControlRenderer, timeControlRendererTest),
  registerEntry(BooleanControlRenderer, booleanControlRendererTest),
  registerEntry(PhoneControlRenderer, phoneControlRendererTest),
];
