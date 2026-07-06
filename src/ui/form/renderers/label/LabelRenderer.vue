<template>
  <Label v-bind="{ ...label, ...appliedOptions }" />
</template>

<script setup lang="ts">
import { uiTypeIs } from "@jsonforms/core";
import { useJsonFormsLabel } from "@jsonforms/vue";
import { Label } from "../../../label";
import { useUpmindUILabelRenderer } from "../utils";
import type { LabelElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -------------------------------------------------------------------

const props = defineProps<RendererProps<LabelElement>>();

const renderer = useUpmindUILabelRenderer(useJsonFormsLabel(props));

// Destructure renderer properties
const { label, appliedOptions } = renderer;
</script>

<script lang="ts">
export const tester = {
  rank: 1,
  controlType: uiTypeIs("Label")
};
</script>
