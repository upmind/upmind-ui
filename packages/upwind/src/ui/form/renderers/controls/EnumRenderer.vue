<template>
  <FormField v-bind="delegatedProps">
    <Select
      :disabled="!control.enabled"
      :model-value="control.data"
      :items="control.options"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
// --- components
import FormField from "../../FormField.vue";
import { Select } from "../../../select";

// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput } = useUpwindRenderer(
  useJsonFormsEnumControl(props)
);
const delegatedProps = computed(() => {
  const options = appliedOptions.value || {};

  return {
    id: control.value.id,
    name: control.value.path,
    errors: control.value.errors,
    // ---
    label: control.value.label,
    description: control.value.description,
    // ---
    required: control.value.required,
    disabled: !control.value.enabled,
    visible: control.value.visible,
    ...options,
  };
});
</script>

<script lang="ts">
import { isEnumControl } from "@jsonforms/core";
export const tester = { rank: 2, controlType: isEnumControl };
</script>
