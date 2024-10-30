<template>
  <FormField v-bind="formFieldProps">
    <Input
      :model-value="control.data"
      @update:modelValue="onInput"
      type="email"
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

const { control, formFieldProps, onInput } = useUpwindRenderer(
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
