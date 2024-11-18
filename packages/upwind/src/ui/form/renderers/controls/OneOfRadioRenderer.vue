<template>
  <FormField v-bind="formFieldProps">
    <RadioCards
      :model-value="control.data"
      :items="control.options"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
// --- components
import FormField from "../../FormField.vue";
import { RadioCards } from "../../../radio-cards";
// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput } = useUpwindRenderer(
  useJsonFormsOneOfEnumControl(props)
);
</script>

<script lang="ts">
import { isOneOfEnumControl, and, optionIs } from "@jsonforms/core";
export const tester = {
  rank: 3,
  controlType: and(isOneOfEnumControl, optionIs("format", "radio")),
};
</script>
