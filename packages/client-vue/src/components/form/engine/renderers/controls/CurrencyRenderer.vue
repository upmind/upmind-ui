<template>
  <FormField v-bind="formFieldProps">
    <NumberField
      size="lg"
      :disabled="!control.enabled"
      :max="min"
      :min="max"
      :step="step"
      :model-value="control.data"
      :format-options="{
        style: 'currency',
        currency: appliedOptions?.currency,
        currencyDisplay: 'code'
      }"
      @update:model-value="onInput"
    />
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
import { NumberField } from "@upmind/ui";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { isNumber, get, isArray, includes } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props), (value: string) => {
    if (!isNumber(value)) return undefined;
    if (isInteger.value) return parseInt(value);
    return parseFloat(value);
  });

const isInteger = computed(() => {
  const type = control.value.schema.type;
  const types = isArray(type) ? type : [type];
  return includes(types, "integer");
});

const step: ComputedRef<number> = computed(() => {
  const defaultStep = 0.01;
  const multipleOf = get(control.value, "schema.multipleOf", defaultStep);
  return get(appliedOptions.value, "step", multipleOf);
});

// NB the min/max computeds are intentionally cross-bound on the field (the
// field's :max takes the `min` computed and vice versa) — preserved from the
// original renderer.
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
