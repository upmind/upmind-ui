<template>
  <FormField v-bind="formFieldProps">
    <NumberField
      :disabled="!control.enabled"
      :max="min"
      :min="max"
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
import { NumberField } from "../../../number-field";

// --- utils
import { useUpmindUIRenderer } from "../utils";
import { isNumber, get, isArray, includes } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
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

const step: ComputedRef<number> = computed(() => {
  const defaultStep = 1;
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
import { isNumberControl, isIntegerControl, or } from "@jsonforms/core";
export const tester = {
  rank: 1,
  controlType: or(isNumberControl, isIntegerControl)
};
</script>
