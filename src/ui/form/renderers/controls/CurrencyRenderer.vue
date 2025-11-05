<template>
  <FormField v-bind="formFieldProps">
    <Input
      type="text"
      inputmode="decimal"
      :placeholder="appliedOptions?.placeholder"
      :autocomplete="appliedOptions?.autocomplete"
      :disabled="appliedOptions?.disabled"
      :model-value="displayValue"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import FormField from "../../FormField.vue";
import { Input } from "../../../input";

// --- utils
import { useUpmindUIRenderer } from "../utils";

// --- types
import type { ComputedRef } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const {
  control,
  appliedOptions,
  formFieldProps,
  onInput: baseOnInput
} = useUpmindUIRenderer(useJsonFormsControl(props));

const displayValue: ComputedRef<string> = computed(() => {
  const value = control.value.data;
  if (value === null || value === undefined || value === "") return "";
  return String(value);
});

const onInput = (value: string | number) => {
  // Convert to string for processing
  const strValue = String(value);

  // Allow empty string
  if (strValue === "") {
    baseOnInput("");
    return;
  }

  // Remove any non-numeric characters except decimal point and minus sign
  const cleaned = strValue.replace(/[^\d.-]/g, "");

  // Validate numeric format
  // Allow formats like: 123, 123.45, .45, -123, -123.45, -.45
  if (cleaned === "" || cleaned === "-" || cleaned === ".") {
    // Partial input - allow it but don't commit
    return;
  }

  // Check if it's a valid number
  const numValue = parseFloat(cleaned);
  if (!isNaN(numValue)) {
    baseOnInput(numValue);
  }
};
</script>

<script lang="ts">
import {
  isNumberControl,
  isIntegerControl,
  and,
  or,
  optionIs,
  formatIs
} from "@jsonforms/core";

export const tester = {
  rank: 2,
  controlType: and(
    or(isNumberControl, isIntegerControl),
    or(formatIs("currency"), optionIs("type", "currency"))
  )
};
</script>
