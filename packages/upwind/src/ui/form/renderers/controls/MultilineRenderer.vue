<template>
  <FormField v-bind="formFieldProps">
    <Textarea
      :max="safeMax"
      :min="safeMin"
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
import { Textarea } from "../../../textarea";

// --- utils
import { useUpwindRenderer } from "../utils";
import { isNil } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput, formFieldProps } = useUpwindRenderer(
  useJsonFormsControl(props)
);

const safeMin: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.min;
  if (!isNil(applied)) return applied;

  const minimum = control.value?.schema?.minimum;
  if (!isNil(minimum)) return minimum;

  return undefined;
});

const safeMax: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.max;
  if (!isNil(applied)) return applied;

  const maximum = control.value?.schema?.maximum;
  if (!isNil(maximum)) return maximum;

  return undefined;
});
</script>

<script lang="ts">
import { isStringControl, isMultiLineControl, and } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(isStringControl, isMultiLineControl),
};
</script>
