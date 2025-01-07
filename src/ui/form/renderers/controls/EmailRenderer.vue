<template>
  <FormField v-bind="formFieldProps">
    <Input
      type="email"
      :placeholder="appliedOptions?.placeholder"
      :autocomplete="appliedOptions?.autocomplete"
      :disabled="appliedOptions?.disabled"
      :model-value="control.data"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import FormField from "../../FormField.vue";
import { Input } from "../../../input";
// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput, appliedOptions } = useUpwindRenderer(
  useJsonFormsControl(props)
);
</script>

<script lang="ts">
import { and, isStringControl, optionIs } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(isStringControl, optionIs("format", "email")),
};
</script>
