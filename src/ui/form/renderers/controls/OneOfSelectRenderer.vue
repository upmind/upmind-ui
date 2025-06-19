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
// --- external
import { useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
// --- components
import FormField from "../../FormField.vue";
import { Select } from "../../../select";

// --- utils
import { useUpmindUIRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput, appliedOptions } =
  useUpmindUIRenderer(useJsonFormsOneOfEnumControl(props));
</script>

<script lang="ts">
import { isOneOfControl } from "@jsonforms/core";
export const tester = { rank: 2, controlType: isOneOfControl };
</script>
