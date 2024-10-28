<template>
  <FormField v-bind="delegatedProps">
    <RadioCards
      :model-value="control.data"
      :items="control.options"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
// --- components
import FormField from "../../FormField.vue";
import { RadioCards } from "../../../radio-cards";
// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput } = useUpwindRenderer(
  useJsonFormsOneOfEnumControl(props)
);
const delegatedProps = computed(() => {
  const options = appliedOptions.value || {};

  return {
    // ---
    label: control.value.label,
    description: control.value.description,
    // ---
    required: control.value.required,
    disabled: !control.value.enabled,
    visible: control.value.visible,
    ...options,
    // --- immutable
    id: control.value.id,
    name: control.value.path,
    errors: control.value.errors,
  };
});
</script>

<script lang="ts">
import { isOneOfEnumControl, and, optionIs } from "@jsonforms/core";
export const tester = {
  rank: 3,
  controlType: and(isOneOfEnumControl, optionIs("format", "radio")),
};
</script>
