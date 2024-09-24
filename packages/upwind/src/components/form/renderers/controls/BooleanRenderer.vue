<template>
  <UpwCheckbox
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :model-value="control.data"
    @change="onChange"
  />
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isBooleanControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import UpwCheckbox from "../../../checkbox/Checkbox.vue";

// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// ----------------------------------------------

export default defineComponent({
  name: "BooleanRenderer",
  components: {
    UpwCheckbox,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target.checked
    );

    // we dont process styles as  we are using an upwind control, so rather pass the configs and allow the control to handle it
    return {
      ...renderer,
    };
  },
});

export const tester = { rank: 2, controlType: isBooleanControl };
</script>
