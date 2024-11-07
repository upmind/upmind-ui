<template>
  <FormField v-bind="formFieldProps">
    <Select
      :model-value="control.data?.toString()"
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
import { Select } from "../../../select";

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
import { isOneOfEnumControl } from "@jsonforms/core";
export const tester = { rank: 2, controlType: isOneOfEnumControl };
</script>
