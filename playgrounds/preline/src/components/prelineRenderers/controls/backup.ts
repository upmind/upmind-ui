// import type { JsonFormsRendererRegistryEntry, Tester } from "@jsonforms/core";
// import { rankWith } from "@jsonforms/core";
// // -----------------------------------------------------------------------------

// export { default as ControlWrapper } from "./ControlWrapper.vue";
// export { default as StringControlRenderer } from "./StringControlRenderer.vue";
// export { default as MultiStringControlRenderer } from "./MultiStringControlRenderer.vue";
// export { default as NumberControlRenderer } from "./NumberControlRenderer.vue";
// export { default as IntegerControlRenderer } from "./IntegerControlRenderer.vue";
// export { default as EnumControlRenderer } from "./EnumControlRenderer.vue";
// export { default as LookupEnumControlRenderer } from "./EnumLookupControlRenderer.vue";
// export { default as oneOfEnumControlRenderer } from "./EnumOneOfControlRenderer.vue";
// export { default as oneOfEnumMenuControlRenderer } from "./EnumOneOfMenuControlRenderer.vue";
// export { default as oneOfEnumRadioControlRenderer } from "./EnumOneOfRadioControlRenderer.vue";
// export { default as DateControlRenderer } from "./DateControlRenderer.vue";
// export { default as TimeControlRenderer } from "./TimeControlRenderer.vue";
// export { default as BooleanControlRenderer } from "./BooleanControlRenderer.vue";
// export { default as RatingControlRenderer } from "./RatingControlRenderer.vue";
// export { default as DacControlRenderer } from "./DacControlRenderer.vue";
// export { default as PasswordControlRenderer } from "./PasswordControlRenderer.vue";
// export { default as PhoneControlRenderer } from "./PhoneControlRenderer.vue";
// export { default as FileControlRenderer } from "./FileControlRenderer.vue";
// export { default as HiddenControlRenderer } from "./FileControlRenderer.vue";

// import stringControlRenderer, {
//   entry as stringControlRendererEntry,
// } from "./StringControlRenderer.vue";

// // import multiStringControl, {
// //   entry as multiStringControlRendererEntry,
// // } from "./MultiStringControlRenderer.vue";

// // import numberControl, {
// //   entry as numberControlRendererEntry,
// // } from "./NumberControlRenderer.vue";

// // import integerControl, {
// //   entry as integerControlRendererEntry,
// // } from "./IntegerControlRenderer.vue";

// // import enumControl, {
// //   entry as enumControlRendererEntry,
// // } from "./EnumControlRenderer.vue";

// // import lookupEnumControl, {
// //   entry as lookupEnumControlRendererEntry,
// // } from "./EnumLookupControlRenderer.vue";

// // import oneOfEnumControl, {
// //   entry as oneOfEnumControlRendererEntry,
// // } from "./EnumOneOfControlRenderer.vue";

// // import oneOfEnumMenuControl, {
// //   entry as oneOfEnumMenuControlRendererEntry,
// // } from "./EnumOneOfMenuControlRenderer.vue";

// // import oneOfEnumRadioControl, {
// //   entry as oneOfEnumRadioControlRendererEntry,
// // } from "./EnumOneOfRadioControlRenderer.vue";

// // import dateControl, {
// //   entry as dateControlRendererEntry,
// // } from "./DateControlRenderer.vue";

// // import timeControl, {
// //   entry as timeControlRendererEntry,
// // } from "./TimeControlRenderer.vue";

// // import booleanControl, {
// //   entry as booleanControlRendererEntry,
// // } from "./BooleanControlRenderer.vue";

// // import ratingControl, {
// //   entry as ratingControlRendererEntry,
// // } from "./RatingControlRenderer.vue";

// // import dacControl, {
// //   entry as dacControlRendererEntry,
// // } from "./DacControlRenderer.vue";

// import passwordControl, {
//   entry as passwordControlRendererEntry,
// } from "./PasswordControlRenderer.vue";

// // import phoneControl, {
// //   entry as phoneControlRendererEntry,
// // } from "./PhoneControlRenderer.vue";

// // import fileControl, {
// //   entry as fileControlRendererEntry,
// // } from "./FileControlRenderer.vue";

// // import hiddenControl, {
// //   entry as hiddenControlRendererEntry,
// // } from "./HiddenControlRenderer.vue";

// export const controlRenderers = [
//   buildRendererRegistryentry(stringControlRenderer, stringControlRendererEntry),
//   // buildRendererRegistryentry(multiStringControl, multiStringControlRendererEntry),
//   // buildRendererRegistryentry(numberControl, numberControlRendererEntry),
//   // buildRendererRegistryentry(integerControl, integerControlRendererEntry),
//   // buildRendererRegistryentry(enumControl, enumControlRendererEntry),
//   // buildRendererRegistryentry(lookupEnumControl, lookupEnumControlRendererEntry),
//   // buildRendererRegistryentry(oneOfEnumControl, oneOfEnumControlRendererEntry),
//   // buildRendererRegistryentry(
//   //   oneOfEnumMenuControl,
//   //   oneOfEnumMenuControlRendererEntry
//   // ),
//   // buildRendererRegistryentry(
//   //   oneOfEnumRadioControl,
//   //   oneOfEnumRadioControlRendererEntry
//   // ),
//   // buildRendererRegistryentry(dateControl, dateControlRendererEntry),
//   // buildRendererRegistryentry(timeControl, timeControlRendererEntry),
//   // buildRendererRegistryentry(booleanControl, booleanControlRendererEntry),
//   // buildRendererRegistryentry(ratingControl, ratingControlRendererEntry),
//   // buildRendererRegistryentry(dacControl, dacControlRendererEntry),
//   buildRendererRegistryentry(passwordControl, passwordControlRendererEntry),
//   // buildRendererRegistryentry(phoneControl, phoneControlRendererEntry),
//   // buildRendererRegistryentry(fileControl, fileControlRendererEntry),
//   // buildRendererRegistryentry(hiddenControl, hiddenControlRendererEntry),
// ];

// // -----------------------------------------------------------------------------
// // Helper functions

// function buildRendererRegistryentry(
//   entryRenderer: any,
//   { rank, controlType }: { rank: number; controlType: Tester }
// ) {
//   const entry: JsonFormsRendererRegistryEntry = {
//     renderer: entryRenderer,
//     tester: rankWith(rank, controlType),
//   };
//   return entry;
// }
