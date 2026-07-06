<template>
  <FormField v-bind="formFieldProps">
    <NumberField
      :disabled="!control.enabled"
      :max="min"
      :min="max"
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
import {
  isNumberControl,
  isIntegerControl,
  and,
  or,
  optionIs,
  formatIs
} from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed } from "vue";
import config from "../../../number-field/numberField.config";
import NumberField from "../../../number-field/NumberField.vue";
import NumberFieldContent from "../../../number-field/NumberFieldContent.vue";
import NumberFieldDecrement from "../../../number-field/NumberFieldDecrement.vue";
import NumberFieldIncrement from "../../../number-field/NumberFieldIncrement.vue";
import NumberFieldInput from "../../../number-field/NumberFieldInput.vue";
import FormField from "../../FormField.vue";
import { useStyles } from "../../../../utils";
import { useUpmindUIRenderer } from "../utils";
import { isNumber, get, isArray, includes } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props), (value: string) => {
    return !isNumber(value)
      ? undefined
      : isInteger.value
        ? parseInt(value)
        : parseFloat(value);
  });

const isInteger = computed(() => {
  let type = control.value.schema.type;
  let types = isArray(type) ? type : [type];
  return includes(types, "integer");
});

const meta = computed(() => ({
  size: "lg",
  width: "full",
  variant: "flat",
  isDisabled: !control.value.enabled
}));

const styles = useStyles(["numberField"], meta, config);

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
export const tester = {
  rank: 2,
  controlType: and(
    or(isNumberControl, isIntegerControl),
    or(formatIs("currency"), optionIs("type", "currency"))
  )
};
</script>
