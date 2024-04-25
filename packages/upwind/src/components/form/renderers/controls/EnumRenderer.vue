<template>
  <upw-select
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :model-value="control.data"
    :items="control.options"
    @change="onChange"
  >
  </upw-select>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isEnumControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsEnumControl } from "@jsonforms/vue";

// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "EnumRenderer",

  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsEnumControl(props),
      target => (target.selectedIndex === 0 ? undefined : target.value)
    );
    return {
      ...renderer,
    };
  },
});

export const tester = { rank: 2, controlType: isEnumControl };
</script>
