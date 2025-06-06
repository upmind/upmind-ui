<template>
  <ModelRendererContent v-if="formFieldProps.visible" v-bind="props" />
</template>

<script setup lang="ts">
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import ModelRendererContent from "./ModelRendererContent.vue";
import { useUpmindUIRenderer, FormField } from "@upmind-automation/upmind-ui";

// --- types
import type { RendererProps } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";

const props = defineProps<RendererProps<ControlElement>>();

const { formFieldProps } = useUpmindUIRenderer(useJsonFormsControl(props));
</script>

<script lang="ts">
import { uiTypeIs, and } from "@jsonforms/core";

export const tester = {
  rank: 4,
  controlType: and(uiTypeIs("Model")),
};
</script>
