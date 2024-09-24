<template>
  <UpwSelect
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :model-value="control.data"
    :items="appliedOptions?.items || control.options"
    @change="onChange"
  >
  </UpwSelect>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isOneOfEnumControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
// --- components
import UpwSelect from "../../../select/Select.vue";

// --- utils
import { useUpwindRenderer } from "../utils";
import { find } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "OneOfRenderer",
  components: {
    UpwSelect,
  },

  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsOneOfEnumControl(props),
      target =>
        find(
          renderer.control.value.options,
          ({ value }) => value == target.value
        )?.value
    );

    return {
      ...renderer,
    };
  },
});

export const tester = { rank: 2, controlType: isOneOfEnumControl };
</script>
