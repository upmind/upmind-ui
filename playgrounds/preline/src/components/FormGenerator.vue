<script lang="ts">
import { defineComponent } from "vue";
import { utils } from "@upmind/flow";
import { UpmFormGenerator } from "@upmind/ui";
import {
  defaultStyles,
  mergeStyles,
  vanillaRenderers,
} from "@jsonforms/vue-vanilla";

import { uiTypeIs } from "@jsonforms/core";

import type { JsonFormsRendererRegistryEntry, Tester } from "@jsonforms/core";
import { rankWith } from "@jsonforms/core";

// import {
//   defaultStyles,
//   mergeStyles,
//   vanillaRenderers,
// } from "@jsonforms/vue-vanilla";

// import { uiTypeIs } from "@jsonforms/core";

// import type { JsonFormsRendererRegistryEntry, Tester } from "@jsonforms/core";
// import { rankWith } from "@jsonforms/core";

// import { defaultStyles, mergeStyles } from "@/components/prelineRenderers";

import stringControlRenderer, {
  test as stringControlRendererTest,
} from "../components/prelineRenderers/controls/StringControlRenderer.vue";

// import multiStringControlRenderertest, {
//   test as multiStringControlRenderertest,
// } from "../components/prelineRenderers/controls/MultiStringControlRenderer.vue";
// import numberControlRenderer, {
//   test as numberControlRenderertest,
// } from "../components/prelineRenderers/controls/NumberControlRenderer.vue";
// import ntegerControlRenderer, {
//   test as integerControlRenderertest,
// } from "../components/prelineRenderers/controls/IntegerControlRenderer.vue";
// import enumControlRenderer, {
//   test as enumControlRenderertest,
// } from "../components/prelineRenderers/controls/EnumControlRenderer.vue";
// import upEnumControlRenderer, {
//   test as lookupEnumControlRenderertest,
// } from "../components/prelineRenderers/controls/EnumLookupControlRenderer.vue";
// import OfEnumControlRenderer, {
//   test as oneOfEnumControlRenderertest,
// } from "../components/prelineRenderers/controls/EnumOneOfControlRenderer.vue";
// import umMenuControlRenderer, {
//   test as oneOfEnumMenuControlRenderertest,
// } from "../components/prelineRenderers/controls/EnumOneOfMenuControlRenderer.vue";
// import mRadioControlRenderer, {
//   test as oneOfEnumRadioControlRenderertest,
// } from "../components/prelineRenderers/controls/EnumOneOfRadioControlRenderer.vue";
// import dateControlRenderer, {
//   test as dateControlRenderertest,
// } from "../components/prelineRenderers/controls/DateControlRenderer.vue";
// import timeControlRenderer, {
//   test as timeControlRenderertest,
// } from "../components/prelineRenderers/controls/TimeControlRenderer.vue";
// import ooleanControlRenderer, {
//   test as booleanControlRenderertest,
// } from "../components/prelineRenderers/controls/BooleanControlRenderer.vue";
// import ratingControlRenderer, {
//   test as ratingControlRenderertest,
// } from "../components/prelineRenderers/controls/RatingControlRenderer.vue";
// import dacControlRenderer, {
//   test as dacControlRenderertest,
// } from "../components/prelineRenderers/controls/DacControlRenderer.vue";
// import sswordControlRenderer, {
//   test as passwordControlRenderertest,
// } from "../components/prelineRenderers/controls/PasswordControlRenderer.vue";
// import phoneControlRenderer, {
//   test as phoneControlRenderertest,
// } from "../components/prelineRenderers/controls/PhoneControlRenderer.vue";
// import fileControlRenderer, {
//   test as fileControlRenderertest,
// } from "../components/prelineRenderers/controls/FileControlRenderer.vue";
// import hiddenControlRenderer, {
//   test as hiddenControlRenderertest,
// } from "../components/prelineRenderers/controls/HiddenControlRenderer.vue";

export const controlRenderers = [
  buildRendererRegistryEntry(stringControlRenderer, stringControlRendererTest),
  // multiStringControlRendererEntry,
  // numberControlRendererEntry,
  // integerControlRendererEntry,
  // enumControlRendererEntry,
  // lookupEnumControlRendererEntry,
  // oneOfEnumControlRendererEntry,
  // oneOfEnumMenuControlRendererEntry,
  // oneOfEnumRadioControlRendererEntry,
  // dateControlRendererEntry,
  // timeControlRendererEntry,
  // booleanControlRendererEntry,
  // ratingControlRendererEntry,
  // dacControlRendererEntry,
  // passwordControlRendererEntry,
  // phoneControlRendererEntry,
  // fileControlRendererEntry,
  // hiddenControlRendererEntry,
];
// import PrelineStringRendererComponent, {
//   test,
// } from "../components/prelineRenderers/controls/StringControlRenderer.vue";
// debugger;

function buildRendererRegistryEntry(testRenderer: any, controlType: Tester) {
  const entry: JsonFormsRendererRegistryEntry = {
    renderer: testRenderer,
    tester: rankWith(3, controlType),
  };
  return entry;
}

// const customRendererEntry = buildRendererRegistryEntry(
//   PrelineStringRendererComponent,
//   test
// );

export default defineComponent({
  name: "FormGenerator",
  extends: UpmFormGenerator,
  setup(props) {
    // -------
    // Her we setup and Provide the preline specific Renderers

    const { ajv } = utils.useValidation();

    // mergeStyles combines all classes from both styles definitions into one
    const formStyles = mergeStyles(defaultStyles, props.styles);

    // -------
    return {
      // -------
      ajv,
      renderers: Object.freeze([...vanillaRenderers, ...controlRenderers]),
      formStyles,
    };
  },
});
</script>
