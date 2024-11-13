<template>
  <FormField v-bind="formFieldProps">
    <Input
      type="email"
      :max="safeMax"
      :min="safeMin"
      :placeholder="appliedOptions?.placeholder"
      :autocomplete="appliedOptions?.autocomplete"
      :maxlength="appliedOptions?.maxLength"
      :minlength="appliedOptions?.minLength"
      :disabled="appliedOptions?.disabled"
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
import { isNil } from "lodash";

// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ComputedRef } from "vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, onInput, appliedOptions } = useUpwindRenderer(
  useJsonFormsControl(props)
);

const safeMin: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.minLength;
  if (!isNil(applied)) return applied;

  const minimum = control.value?.schema?.minLength;
  if (!isNil(minimum)) return minimum;

  return undefined;
});

const safeMax: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.maxLength;
  if (!isNil(applied)) return applied;

  const maximum = control.value?.schema?.maxLength;
  if (!isNil(maximum)) return maximum;

  return undefined;
});
</script>

<script lang="ts">
import { and, isStringControl, optionIs, or } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(
    isStringControl,
    or(optionIs("format", "email"), optionIs("format", "username"))
  ),
};
</script>
