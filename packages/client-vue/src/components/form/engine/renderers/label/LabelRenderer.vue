<template>
  <Label v-if="label.visible">{{ label.text }}</Label>
</template>

<script setup lang="ts">
import { uiTypeIs } from "@jsonforms/core";
import { useJsonFormsLabel } from "@jsonforms/vue";
import { Label } from "@upmind/ui";
import { useUpmindUILabelRenderer } from "../utils";
import type { LabelElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -------------------------------------------------------------------

const props = defineProps<RendererProps<LabelElement>>();

const { label } = useUpmindUILabelRenderer(useJsonFormsLabel(props));
</script>

<script lang="ts">
export const tester = {
  rank: 1,
  controlType: uiTypeIs("Label")
};
</script>
