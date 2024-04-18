<template>
  <label v-if="label.visible" :class="styles.label.root">
    <span :class="styles.label.text" v-if="label.text"> {{ label.text }}</span>
    <span :class="styles.label.alt" v-if="label.alt"> {{ label.alt }}</span>
  </label>
</template>

<script lang="ts">
import type { LabelElement } from "@jsonforms/core";
import { uiTypeIs } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsLabel } from "@jsonforms/vue";
import { useUpwindLabel } from "../utils";

const labelRenderer = defineComponent({
  name: "LabelRenderer",
  props: {
    ...rendererProps<LabelElement>(),
  },
  setup(props: RendererProps<LabelElement>) {
    return useUpwindLabel(useJsonFormsLabel(props));
  },
});

export default labelRenderer;

export const tester = {
  rank: 1,
  controlType: uiTypeIs("Label"),
};
</script>
../utils ../utils
