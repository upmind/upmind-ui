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

import { entry as stringControlRendererEntry } from "./StringControlRenderer.vue";
import { entry as multiStringControlRendererEntry } from "./MultiStringControlRenderer.vue";
import { entry as numberControlRendererEntry } from "./NumberControlRenderer.vue";
import { entry as integerControlRendererEntry } from "./IntegerControlRenderer.vue";
import { entry as enumControlRendererEntry } from "./EnumControlRenderer.vue";
import { entry as lookupEnumControlRendererEntry } from "./EnumLookupControlRenderer.vue";
import { entry as oneOfEnumControlRendererEntry } from "./EnumOneOfControlRenderer.vue";
import { entry as oneOfEnumMenuControlRendererEntry } from "./EnumOneOfMenuControlRenderer.vue";
import { entry as oneOfEnumRadioControlRendererEntry } from "./EnumOneOfRadioControlRenderer.vue";
import { entry as dateControlRendererEntry } from "./DateControlRenderer.vue";
import { entry as timeControlRendererEntry } from "./TimeControlRenderer.vue";
import { entry as booleanControlRendererEntry } from "./BooleanControlRenderer.vue";
import { entry as ratingControlRendererEntry } from "./RatingControlRenderer.vue";
import { entry as dacControlRendererEntry } from "./DacControlRenderer.vue";
import { entry as passwordControlRendererEntry } from "./PasswordControlRenderer.vue";
import { entry as phoneControlRendererEntry } from "./PhoneControlRenderer.vue";
import { entry as fileControlRendererEntry } from "./FileControlRenderer.vue";
import { entry as hiddenControlRendererEntry } from "./HiddenControlRenderer.vue";

export const controlRenderers = [
  stringControlRendererEntry,
  multiStringControlRendererEntry,
  numberControlRendererEntry,
  integerControlRendererEntry,
  enumControlRendererEntry,
  lookupEnumControlRendererEntry,
  oneOfEnumControlRendererEntry,
  oneOfEnumMenuControlRendererEntry,
  oneOfEnumRadioControlRendererEntry,
  dateControlRendererEntry,
  timeControlRendererEntry,
  booleanControlRendererEntry,
  ratingControlRendererEntry,
  dacControlRendererEntry,
  passwordControlRendererEntry,
  phoneControlRendererEntry,
  fileControlRendererEntry,
  hiddenControlRendererEntry,
];
