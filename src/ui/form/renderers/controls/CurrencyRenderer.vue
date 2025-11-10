<template>
  <FormField v-bind="formFieldProps">
    <NumberField
      :min="minimum"
      :max="maximum"
      :step="step"
      :model-value="control.data"
      @update:modelValue="onInput"
      :format-options="{
        style: 'currency',
        currency: currency,
        currencyDisplay: 'code',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }"
      :class="styles.numberField.root"
    >
      <NumberFieldContent>
        <NumberFieldDecrement />
        <NumberFieldInput :class="styles.numberField.field" />
        <NumberFieldIncrement />
      </NumberFieldContent>
    </NumberField>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";

// --- internal
import config from "../../../number-field/numberField.config";
import { useStyles } from "../../../../utils";

// --- components
import FormField from "../../FormField.vue";
import NumberField from "../../../number-field/NumberField.vue";
import NumberFieldContent from "../../../number-field/NumberFieldContent.vue";
import NumberFieldDecrement from "../../../number-field/NumberFieldDecrement.vue";
import NumberFieldIncrement from "../../../number-field/NumberFieldIncrement.vue";
import NumberFieldInput from "../../../number-field/NumberFieldInput.vue";

// --- utils
import { useUpmindUIRenderer } from "../utils";
import { isNumber, get, isString } from "lodash-es";

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

const meta = computed(() => ({
  size: "lg",
  width: "full",
  variant: "flat",
  isDisabled: !control.value.enabled
}));

const styles = useStyles(["numberField"], meta, config) as ComputedRef<{
  numberField: {
    root: string;
    input: string;
    field: string;
  };
}>;

// Currency increment/decrement by whole numbers, but allow decimal input
const CURRENCY_STEP = 1;
const DECIMAL_BUFFER = 0.99;

const currency = computed(() => get(appliedOptions.value, "currency"));

const step = computed(() => get(appliedOptions.value, "step", CURRENCY_STEP));

const minimum = computed(() => {
  const applied = appliedOptions.value?.min;
  if (isNumber(applied)) return applied;

  const minimum = control.value?.schema?.minimum;
  if (isNumber(minimum)) return minimum;

  const exclusiveMinimum = control.value?.schema?.exclusiveMinimum;
  if (isNumber(exclusiveMinimum)) return exclusiveMinimum + step.value;

  return undefined;
});

const schemaMaximum = computed(() => {
  const applied = appliedOptions.value?.max;
  if (isNumber(applied)) return applied;

  const maximum = control.value?.schema?.maximum;
  if (isNumber(maximum)) return maximum;

  const exclusiveMaximum = control.value?.schema?.exclusiveMaximum;
  if (isNumber(exclusiveMaximum)) return exclusiveMaximum - step.value;

  return undefined;
});

// Add buffer to maximum to allow increment button to remain enabled
// when working with currency values that include decimal cents
const maximum = computed(() =>
  schemaMaximum.value
    ? schemaMaximum.value + DECIMAL_BUFFER
    : schemaMaximum.value
);

/**
 * Clamps a numeric value within optional minimum and maximum bounds.
 * Used to ensure currency input values respect schema constraints.
 */
const clamp = (value: number, min?: number, max?: number) => {
  let clamped = value;
  if (max && clamped > max) clamped = max; // Cap value at maximum bound
  if (min && clamped < min) clamped = min; // Raise value to minimum bound
  return clamped; // Return constrained value
};

const onInput = (value: string | number) => {
  const numValue = isString(value) ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    baseOnInput("");
    return;
  }

  baseOnInput(clamp(numValue, minimum.value, schemaMaximum.value));
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
