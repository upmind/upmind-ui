<template>
  <ModelListRendererContent
    v-if="formFieldProps.visible && hasComposable"
    v-bind="props"
  />
</template>

<script setup lang="ts">
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import ModelListRendererContent from "./ModelListRendererContent.vue";
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";

// --- utils
import { get, isFunction } from "lodash-es";

// --- types
import type { RendererProps } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";
import { computed } from "vue";

const props = defineProps<RendererProps<ControlElement>>();

const { formFieldProps, control } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

const hasComposable = computed(() => {
  return isFunction(get(control.value.uischema, "options.use"));
});
</script>

<script lang="ts">
import { uiTypeIs, and } from "@jsonforms/core";

export const tester = {
  rank: 4,
  controlType: and(uiTypeIs("ModelList")),
};
</script>
