<template>
  <FormField v-bind="formFieldProps">
    <Select
      :model-value="control.data"
      :items="control.options"
      :placeholder="appliedOptions?.placeholder"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
import { isOneOfControl } from "@jsonforms/core";
import { useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
import { Select } from "../../../select";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput, appliedOptions } =
  useUpmindUIRenderer(useJsonFormsOneOfEnumControl(props));
</script>

<script lang="ts">
export const tester = { rank: 2, controlType: isOneOfControl };
</script>
