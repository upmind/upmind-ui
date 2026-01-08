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
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout
} from "@jsonforms/vue";

// --- local
import config from "./layouts.config";
// --- utils
import { useUpmindUILayoutRenderer } from "../utils";
import { useStyles } from "../../../../utils";

// --- types
import type { Layout } from "@jsonforms/core";

// -------------------------------------------------------------------

const props = defineProps({
  ...rendererProps<Layout>(),
  // ---  Additional Attributes
  pristine: {
    type: Boolean,
    default: false
  },
  // --- Provide a way to add custom styles for a specific instance of the component
  uiConfig: { type: [Object, Array], default: () => ({}) }
});

const meta = computed(() => ({
  isVisible: layout.value.visible,
  isDisabled: !layout.value.enabled,
  isHorizontal: layout.value.direction === "row",
  isPristine: props.pristine
}));

const styles = useStyles(["layout"], meta, config, props.uiConfig ?? {});

const { layout, appliedOptions } = useUpmindUILayoutRenderer(
  useJsonFormsLayout(props)
);
</script>

<script lang="ts">
import { isLayout } from "@jsonforms/core";
export const tester = { rank: 1, controlType: isLayout };
</script>
