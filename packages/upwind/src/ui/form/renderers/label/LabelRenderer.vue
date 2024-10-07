<template>
  <UpwLabel
    v-bind="{ ...label, ...appliedOptions }"
    :disabled="!label.enabled"
  />
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { uiTypeIs } from "@jsonforms/core";
import { rendererProps, useJsonFormsLabel } from "@jsonforms/vue";

// --- components
import UpwLabel from "../../../label/Label.vue";

// --- utils
import { useUpwindLabelRenderer } from "../utils";

// --- types
import type { LabelElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// -------------------------------------------------------------------

export default defineComponent({
  name: "LabelRenderer",
  components: {
    UpwLabel,
  },
  props: {
    ...rendererProps<LabelElement>(),
  },
  setup(props: RendererProps<LabelElement>) {
    const renderer = useUpwindLabelRenderer(useJsonFormsLabel(props));
    return {
      ...renderer,
    };
  },
});

export const tester = {
  rank: 1,
  controlType: uiTypeIs("Label"),
};
</script>
