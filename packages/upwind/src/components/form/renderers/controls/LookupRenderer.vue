<template>
  <upw-combobox
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-lookup'"
    :disabled="!control.enabled"
    :model-value="control.data"
    :items="control.options || appliedOptions.items"
    :search="search"
    @change="onChange"
  >
  </upw-combobox>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { schemaMatches, uiTypeIs, and } from "@jsonforms/core";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";

// --- components
import UpwCombobox from "../../../combobox/Combobox.vue";

// --- utils
import { useUpwindRenderer } from "../utils";
import { has, get } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "LookupRenderer",
  components: {
    UpwCombobox,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsOneOfEnumControl(props),
      target => target.value || undefined
    );
    return {
      ...renderer,
      search: get(renderer.control.value, "schema.lookup"),
    };
  },
});

export const tester = {
  rank: 3,
  controlType: and(
    uiTypeIs("Control"),
    schemaMatches(schema => has(schema, "lookup"))
    // schemaMatches(schema => isFunction(get(schema, "lookup.search")))
  ),
};
</script>
