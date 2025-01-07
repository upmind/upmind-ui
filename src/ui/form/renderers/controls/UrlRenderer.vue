<template>
  <FormField v-bind="formFieldProps">
    <Input
      :disabled="!control.enabled"
      :model-value="control.data"
      @update:modelValue="onInput"
      type="url"
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

const { control, onInput, formFieldProps } = useUpwindRenderer(
  useJsonFormsControl(props)
);
</script>

<script lang="ts">
import { and, isStringControl, or, optionIs } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(
    isStringControl,
    or(
      optionIs("format", "uri"),
      optionIs("format", "uri-reference"),
      optionIs("format", "iri"),
      optionIs("format", "iri-reference")
    )
  ),
};
</script>
