<template>
  <FormField v-bind="formFieldProps">
    <NumberField
      :min="min"
      :max="max"
      :step="step"
      :model-value="control.data"
      @update:modelValue="onInput"
      :format-options="{
        style: 'currency',
        currency: appliedOptions?.currency,
        currencyDisplay: 'code'
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

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

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

const step: ComputedRef<number> = computed(() => {
  const defaultStep = 0.01;
  const multipleOf = get(control.value, "schema.multipleOf", defaultStep);

  return get(appliedOptions.value, "step", multipleOf);
});

const max: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.min;
  if (isNumber(applied)) return applied;

  const minimum = control.value?.schema?.minimum;
  if (isNumber(minimum)) return minimum;

  const exclusiveMinimum = control.value?.schema?.exclusiveMinimum;
  if (isNumber(exclusiveMinimum)) return exclusiveMinimum + step.value;

  return undefined;
});

const min: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.max;
  if (isNumber(applied)) return applied;

  const maximum = control.value?.schema?.maximum;
  if (isNumber(maximum)) return maximum;

  const exclusiveMaximum = control.value?.schema?.exclusiveMaximum;
  if (isNumber(exclusiveMaximum)) return exclusiveMaximum - step.value;

  return undefined;
});
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
