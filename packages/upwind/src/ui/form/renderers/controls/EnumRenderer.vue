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
import { useJsonFormsEnumControl } from "@jsonforms/vue";
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
  useJsonFormsEnumControl(props)
);
</script>

<script lang="ts">
import { isEnumControl } from "@jsonforms/core";
export const tester = { rank: 2, controlType: isEnumControl };
</script>
