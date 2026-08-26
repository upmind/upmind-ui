<template>
  <FormField v-bind="formFieldProps">
    <PinInput
      :model-value="(control.data ?? '').split('')"
      :disabled="appliedOptions?.disabled"
      :length="slotCount"
      :auto-focus="appliedOptions?.autoFocus"
      otp
      @update:model-value="value => onInput(value.join(''))"
    />
  </FormField>
</template>

<script lang="ts" setup>
import { and, uiTypeIs, optionIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { PinInput } from "@upmind/ui";
import { computed } from "vue";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { isNil } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput, formFieldProps } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const safeMax: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.maxLength;
  if (!isNil(applied)) return applied;
  const maximum = control.value?.schema?.maxLength;
  if (!isNil(maximum)) return maximum;
  return undefined;
});

// PinInput renders one slot per character; default to a 6-digit one-time code.
const slotCount = computed(() => safeMax.value ?? 6);
</script>

<script lang="ts">
export const tester = {
  rank: 5,
  controlType: and(uiTypeIs("Control"), optionIs("format", "otp"))
};
</script>
