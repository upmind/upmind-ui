import { registerEntry } from "../util/registerEntry";
// -----------------------------------------------------------------------------

export { default as ControlWrapper } from "./ControlWrapper.vue";
export { default as StringControlRenderer } from "./StringControlRenderer.vue";
export { default as MultiStringControlRenderer } from "./MultiStringControlRenderer.vue";
export { default as NumberControlRenderer } from "./NumberControlRenderer.vue";
export { default as IntegerControlRenderer } from "./IntegerControlRenderer.vue";
export { default as EnumControlRenderer } from "./EnumControlRenderer.vue";
export { default as LookupEnumControlRenderer } from "./EnumLookupControlRenderer.vue";
export { default as oneOfEnumControlRenderer } from "./EnumOneOfControlRenderer.vue";
export { default as oneOfEnumMenuControlRenderer } from "./EnumOneOfMenuControlRenderer.vue";
export { default as oneOfEnumRadioControlRenderer } from "./EnumOneOfRadioControlRenderer.vue";
export { default as DateControlRenderer } from "./DateControlRenderer.vue";
export { default as TimeControlRenderer } from "./TimeControlRenderer.vue";
export { default as BooleanControlRenderer } from "./BooleanControlRenderer.vue";
export { default as RatingControlRenderer } from "./RatingControlRenderer.vue";
export { default as DacControlRenderer } from "./DacControlRenderer.vue";
export { default as PasswordControlRenderer } from "./PasswordControlRenderer.vue";
export { default as PhoneControlRenderer } from "./PhoneControlRenderer.vue";
export { default as FileControlRenderer } from "./FileControlRenderer.vue";
export { default as HiddenControlRenderer } from "./FileControlRenderer.vue";

import StringControlRenderer, {
  tester as stringControlRendererTest,
} from "./StringControlRenderer.vue";

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

import LookupEnumControlRenderer, {
  tester as lookupEnumControlRendererTest,
} from "./EnumLookupControlRenderer.vue";

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

import RatingControlRenderer, {
  tester as ratingControlRendererTest,
} from "./RatingControlRenderer.vue";

import DacControlRenderer, {
  tester as dacControlRendererTest,
} from "./DacControlRenderer.vue";

import PasswordControlRenderer, {
  tester as passwordControlRendererTest,
} from "./PasswordControlRenderer.vue";

import PhoneControlRenderer, {
  tester as phoneControlRendererTest,
} from "./PhoneControlRenderer.vue";

import FileControlRenderer, {
  tester as fileControlRendererTest,
} from "./FileControlRenderer.vue";

import HiddenControlRenderer, {
  tester as hiddenControlRendererTest,
} from "./HiddenControlRenderer.vue";

export const controlRenderers = [
  registerEntry(StringControlRenderer, stringControlRendererTest),
  registerEntry(MultiStringControlRenderer, multiStringControlRendererTest),
  registerEntry(NumberControlRenderer, numberControlRendererTest),
  registerEntry(IntegerControlRenderer, integerControlRendererTest),
  registerEntry(EnumControlRenderer, enumControlRendererTest),
  registerEntry(LookupEnumControlRenderer, lookupEnumControlRendererTest),
  registerEntry(OneOfEnumControlRenderer, oneOfEnumControlRendererTest),
  registerEntry(OneOfEnumMenuControlRenderer, oneOfEnumMenuControlRendererTest),
  registerEntry(
    OneOfEnumRadioControlRenderer,
    oneOfEnumRadioControlRendererTest
  ),
  registerEntry(DateControlRenderer, dateControlRendererTest),
  registerEntry(TimeControlRenderer, timeControlRendererTest),
  registerEntry(BooleanControlRenderer, booleanControlRendererTest),
  registerEntry(RatingControlRenderer, ratingControlRendererTest),
  registerEntry(DacControlRenderer, dacControlRendererTest),
  registerEntry(PasswordControlRenderer, passwordControlRendererTest),
  registerEntry(PhoneControlRenderer, phoneControlRendererTest),
  registerEntry(FileControlRenderer, fileControlRendererTest),
  registerEntry(HiddenControlRenderer, hiddenControlRendererTest),
];
