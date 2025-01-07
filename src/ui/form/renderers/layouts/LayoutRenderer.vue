<template>
  <div v-if="layout.visible" :class="styles.layout.root">
    <div
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="styles.layout.item"
    >
      <DispatchRenderer
        :schema="layout.schema"
        :uischema="element"
        :path="layout.path"
        :enabled="layout.enabled"
        :renderers="layout.renderers"
        :pristine="meta.isPristine"
        :cells="layout.cells"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { isLayout } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout,
} from "@jsonforms/vue";

// --- local
import config from "./config.cva";
// --- utils
import { useUpwindLayoutRenderer } from "../utils";
import { useStyles } from "../../../../utils";

// --- types
import type { PropType } from "vue";
import type { Layout } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputProps } from "../controls/types";

// -------------------------------------------------------------------

const props = defineProps({
  ...rendererProps<Layout>(),
  // ---  Additional Attributes
  size: {
    type: String as PropType<InputProps["size"]>,
    default: null,
  },
  pristine: {
    type: Boolean,
    default: false,
  },
  // --- Provide a way to add custom styles for a specific instance of the component
  upwindConfig: { type: [Object, Array], default: () => ({}) },
});

const meta = computed(() => ({
  isVisible: layout.value.visible,
  isDisabled: !layout.value.enabled,
  isHorizontal: layout.value.direction === "row",
  isPristine: props.pristine,
}));

const styles = useStyles(["layout"], meta, config, props.upwindConfig);
const { layout, appliedOptions } = useUpwindLayoutRenderer(
  useJsonFormsLayout(props)
);
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: isLayout };
</script>
