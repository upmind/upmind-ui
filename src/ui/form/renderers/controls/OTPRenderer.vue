<template>
  <FormField v-bind="formFieldProps">
    <InputOTP
      :model-value="control.data ?? ''"
      :placeholder="appliedOptions?.placeholder"
      :autocomplete="appliedOptions?.autocomplete || 'one-time-code'"
      :auto-focus="appliedOptions?.autoFocus"
      :maxlength="safeMax"
      :minlength="safeMin"
      :readonly="appliedOptions?.readonly"
      :required="appliedOptions?.required"
      :disabled="appliedOptions?.disabled"
      @update:model-value="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { and, uiTypeIs, optionIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed } from "vue";

// --- components
import { InputOTP } from "../../../input-otp";
import FormField from "../../FormField.vue";
// --- utils
import { useUpmindUIRenderer } from "../utils";
import { isNil } from "lodash-es";
// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput, formFieldProps } =
  useUpmindUIRenderer(useJsonFormsControl(props));

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
export const tester = {
  rank: 5,
  controlType: and(uiTypeIs("Control"), optionIs("format", "otp"))
};
</script>
