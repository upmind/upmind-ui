<template>
  <FormField v-bind="delegatedProps">
    <Input
      :type="appliedOptions?.type"
      :max="safeMax"
      :min="safeMin"
      :placeholder="appliedOptions?.placeholder"
      :autocomplete="appliedOptions?.autocomplete"
      :maxlength="appliedOptions?.maxLength"
      :minlength="appliedOptions?.minLength"
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
import { useUpwindRenderer } from "../utils";
import { defaults, set, isNil } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { Control, Options } from "../types";

interface StringInputOptions extends Options {
  type?: "text" | "password" | "email" | "number" | "tel" | "url";
  placeholder?: string;
  autocomplete?: string;
  // min?: number;
  // max?: number;
  // step?: number;
  maxLength?: number;
  minLength?: number;
}

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const {
  control,
  appliedOptions,
  onInput,
}: {
  control: ComputedRef<Control>;
  appliedOptions: ComputedRef<StringInputOptions>;
  onInput: (payload: string | number) => any;
} = useUpwindRenderer(useJsonFormsControl(props));

const delegatedProps = computed(() => {
  const options = defaults(
    appliedOptions.value || {
      label: control.value.label,
      description: control.value.description,
      required: control.value.required,
      disabled: !control.value.enabled,
      visible: control.value.visible,
    }
  );

  set(options, "id", control.value.id);
  set(options, "name", control.value.path);
  set(options, "errors", control.value.errors);

  return options;
});

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
