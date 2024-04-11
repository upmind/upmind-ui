import { registerEntry } from "../utils/registerEntry";
// -----------------------------------------------------------------------------

export { default as ControlWrapper } from "./wrapper/Wrapper.vue";
export { default as StringControlRenderer } from "./string/Renderer.vue";
export { default as MultiStringControlRenderer } from "./MultiStringControlRenderer.vue";
export { default as NumberControlRenderer } from "./NumberControlRenderer.vue";
export { default as IntegerControlRenderer } from "./IntegerControlRenderer.vue";
export { default as EnumControlRenderer } from "./EnumControlRenderer.vue";
export { default as oneOfEnumControlRenderer } from "./EnumOneOfControlRenderer.vue";
export { default as oneOfEnumMenuControlRenderer } from "./EnumOneOfMenuControlRenderer.vue";
export { default as oneOfEnumRadioControlRenderer } from "./EnumOneOfRadioControlRenderer.vue";
export { default as DateControlRenderer } from "./DateControlRenderer.vue";
export { default as TimeControlRenderer } from "./TimeControlRenderer.vue";
export { default as BooleanControlRenderer } from "./BooleanControlRenderer.vue";
export { default as PasswordControlRenderer } from "./PasswordControlRenderer.vue";
export { default as PhoneControlRenderer } from "./PhoneControlRenderer.vue";
export { default as HiddenControlRenderer } from "./HiddenControlRenderer.vue";

import StringControlRenderer, {
  tester as stringControlRendererTest,
} from "./string/Renderer.vue";

import MultiStringControlRenderer, {
  tester as multiStringControlRendererTest,
} from "./MultiStringControlRenderer.vue";

import NumberControlRenderer, {
  tester as numberControlRendererTest,
} from "./NumberControlRenderer.vue";

import IntegerControlRenderer, {
  tester as integerControlRendererTest,
} from "./IntegerControlRenderer.vue";

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

import PasswordControlRenderer, {
  tester as passwordControlRendererTest,
} from "./PasswordControlRenderer.vue";

import PhoneControlRenderer, {
  tester as phoneControlRendererTest,
} from "./PhoneControlRenderer.vue";

import HiddenControlRenderer, {
  tester as hiddenControlRendererTest,
} from "./HiddenControlRenderer.vue";

export const controlRenderers = [
  registerEntry(StringControlRenderer, stringControlRendererTest),
  registerEntry(MultiStringControlRenderer, multiStringControlRendererTest),
  registerEntry(NumberControlRenderer, numberControlRendererTest),
  registerEntry(IntegerControlRenderer, integerControlRendererTest),
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
  registerEntry(PasswordControlRenderer, passwordControlRendererTest),
  registerEntry(PhoneControlRenderer, phoneControlRendererTest),
  registerEntry(HiddenControlRenderer, hiddenControlRendererTest),
];
