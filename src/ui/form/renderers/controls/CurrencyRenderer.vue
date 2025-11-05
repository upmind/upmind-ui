<template>
  <FormField v-bind="formFieldProps">
    <Input
      type="number"
      inputmode="decimal"
      :placeholder="appliedOptions?.placeholder"
      :autocomplete="appliedOptions?.autocomplete"
      :disabled="appliedOptions?.disabled"
      :min="minimum"
      :max="maximum"
      :step="step"
      :model-value="control.data"
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
import { isNumber, get } from "lodash-es";

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

const step: ComputedRef<number> = computed(() => {
  const defaultStep = 1;
  return get(appliedOptions.value, "step", defaultStep);
});

const minimum: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.min;
  if (isNumber(applied)) return applied;

  const minimum = control.value?.schema?.minimum;
  if (isNumber(minimum)) return minimum;

  const exclusiveMinimum = control.value?.schema?.exclusiveMinimum;
  if (isNumber(exclusiveMinimum)) return exclusiveMinimum + step.value;

  return undefined;
});

const maximum: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.max;
  if (isNumber(applied)) return applied;

  const maximum = control.value?.schema?.maximum;
  if (isNumber(maximum)) return maximum;

  const exclusiveMaximum = control.value?.schema?.exclusiveMaximum;
  if (isNumber(exclusiveMaximum)) return exclusiveMaximum - step.value;

  return undefined;
});

const onInput = (value: string | number) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    baseOnInput("");
    return;
  }

  baseOnInput(numValue);
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
