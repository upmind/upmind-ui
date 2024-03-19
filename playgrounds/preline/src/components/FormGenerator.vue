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
//   prelineRenderers,
// } from "@/components/prelineRenderers";

import PrelineStringRendererComponent, {
  test,
} from "../components/prelineRenderers/controls/StringControlRenderer.vue";
debugger;

function buildRendererRegistryEntry(testRenderer: any, controlType: Tester) {
  const entry: JsonFormsRendererRegistryEntry = {
    renderer: testRenderer,
    tester: rankWith(3, controlType),
  };
  return entry;
}

const customRendererEntry = buildRendererRegistryEntry(
  PrelineStringRendererComponent,
  test
);

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
      renderers: Object.freeze([...vanillaRenderers, customRendererEntry]),
      formStyles,
    };
  },
});
</script>
