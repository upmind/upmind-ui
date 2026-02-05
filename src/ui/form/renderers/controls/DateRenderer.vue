<template>
  <FormField v-bind="formFieldProps">
    <Input
      v-bind="appliedOptions"
      :model-value="control.data"
      @update:modelValue="onInput"
      type="date"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { and, isStringControl, or, formatIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
// --- components
import { Input } from "../../../input";
import FormField from "../../FormField.vue";
// --- utils
import { useUpmindUIRenderer } from "../utils";
// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

export const tester = {
  rank: 2,
  controlType: and(isStringControl, or(formatIs("date"), formatIs("date-time")))
};
</script>
