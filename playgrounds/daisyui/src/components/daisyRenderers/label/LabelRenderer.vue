<template>
  <label v-if="label.visible" :class="styles.label.root">
    <span :class="styles.label.text" v-if="label.text"> {{ label.text }}</span>
    <span :class="styles.label.alt" v-if="label.alt"> {{ label.alt }}</span>
  </label>
</template>

<script lang="ts">
import type {
  JsonFormsRendererRegistryEntry,
  LabelElement,
} from "@jsonforms/core";
import { rankWith, uiTypeIs } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsLabel } from "@jsonforms/vue";
import { useDaisyLabel } from "../util";

const labelRenderer = defineComponent({
  name: "LabelRenderer",
  props: {
    ...rendererProps<LabelElement>(),
  },
  setup(props: RendererProps<LabelElement>) {
    return useDaisyLabel(useJsonFormsLabel(props));
  },
});

export default labelRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: labelRenderer,
  tester: rankWith(1, uiTypeIs("Label")),
};
</script>
