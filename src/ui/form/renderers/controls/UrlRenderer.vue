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
import { and, isStringControl, or, formatIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { Input } from "../../../input";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, onInput, formFieldProps } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(
    isStringControl,
    or(
      formatIs("uri"),
      formatIs("uri-reference"),
      formatIs("iri"),
      formatIs("iri-reference")
    )
  )
};
</script>
