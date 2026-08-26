<template>
  <FormField v-bind="formFieldProps">
    <NumberField
      :size="appliedOptions?.size"
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
import { NumberField } from "@upmind/ui";
import { computed } from "vue";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { isNumber, get, isArray, includes } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

// Read off `props`, not the hook's `control`: the hook's adaptTarget closes
// over this, so deriving it from the hook's own return is circular.
const isInteger = computed(() => {
  const type = props.schema.type;
  return includes(isArray(type) ? type : [type], "integer");
});

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props), (value: unknown) => {
    const parsed = isInteger.value
      ? parseInt(String(value))
      : parseFloat(String(value));
    return isFinite(parsed) ? parsed : undefined;
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
