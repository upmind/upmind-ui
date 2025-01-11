<template>
  <FormField v-bind="formFieldProps">
    <Input
      :type="appliedOptions?.type"
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

// --- utils
import { useUpmindUIRenderer } from "../utils";
import { isNil } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// import type { FormControlRenderProps, FormControlProps } from "../../types";

// interface StringInputOptions extends FormControlProps {
//   type?: "text" | "password" | "email" | "number" | "tel" | "url";
//   placeholder?: string;
//   autocomplete?: string;
//   // min?: number;
//   // max?: number;
//   // step?: number;
//   maxLength?: number;
//   minLength?: number;
// }

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput, formFieldProps } = useUpmindUIRenderer(
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
import { isStringControl } from "@jsonforms/core";
export const tester = { rank: 1, controlType: isStringControl };
</script>
