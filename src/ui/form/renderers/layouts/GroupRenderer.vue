<template>
  <fieldset v-if="layout.visible" :class="styles.group.root">
    <div v-if="layout.label" :class="styles.group.label">
      <legend>{{ layout.label }}</legend>
    </div>
    <div
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="styles.group.item"
    >
      <DispatchRenderer
        :schema="layout.schema"
        :uischema="element"
        :path="layout.path"
        :enabled="layout.enabled"
        :renderers="layout.renderers"
        :cells="layout.cells"
      />
    </div>
  </fieldset>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout,
} from "@jsonforms/vue";

// --- local
import config from "./layouts.config";
// --- utils
import { useUpmindUILayoutRenderer } from "../utils";
import { useStyles } from "../../../../utils";

// --- types
import type { PropType, ComputedRef } from "vue";
import type { Layout } from "@jsonforms/core";
import type { InputProps } from "../../../input";

// -------------------------------------------------------------------

const props = defineProps({
  ...rendererProps<Layout>(),
  // ---  Additional Attributes
  size: {
    type: String as PropType<InputProps["size"]>,
    default: null,
  },
  // --- Provide a way to add custom styles for a specific instance of the component
  uiConfig: { type: [Object, Array], default: () => ({}) },
});

const meta = computed(() => ({
  isVisible: layout.value.visible,
  isDisabled: !layout.value.enabled,
  hasBorder: appliedOptions.value?.border ?? true,
}));

const styles = useStyles(
  ["group"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  group: {
    root: string;
    label: string;
    item: string;
  };
}>;
const { layout, appliedOptions } = useUpmindUILayoutRenderer(
  useJsonFormsLayout(props)
);
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("Group")),
};
</script>
