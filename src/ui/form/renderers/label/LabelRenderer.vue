<template>
  <Label v-bind="{ ...label, ...appliedOptions }" />
</template>

<script setup lang="ts">
// --- external
import { useJsonFormsLabel } from "@jsonforms/vue";
// --- components
import { Label } from "../../../label";
// --- utils
import { useUpmindUILabelRenderer } from "../utils";
// --- types
import type { LabelElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -------------------------------------------------------------------

const props = defineProps<RendererProps<LabelElement>>();

const renderer = useUpmindUILabelRenderer(useJsonFormsLabel(props));

// Destructure renderer properties
const { label, appliedOptions } = renderer;
</script>

<script lang="ts">
import { uiTypeIs } from "@jsonforms/core";
export const tester = {
  rank: 1,
  controlType: uiTypeIs("Label")
};
</script>
