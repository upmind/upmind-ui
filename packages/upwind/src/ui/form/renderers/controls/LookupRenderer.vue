<template>
  <FormField v-bind="delegatedProps">
    <Combobox
      :disabled="!control.enabled"
      :model-value="control.data"
      :items="control.options"
      @update:modelValue="onInput"
      searchable
      width="full"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
// --- components
import FormField from "../../FormField.vue";
import { Combobox } from "../../../combobox";
// --- utils
import { useUpwindRenderer } from "../utils";
import { has, get } from "lodash-es";

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
    options: options,
    ...options,
  };
});
</script>

<script lang="ts">
import { schemaMatches, uiTypeIs, and } from "@jsonforms/core";
export const tester = {
  rank: 3,
  controlType: and(
    uiTypeIs("Control"),
    schemaMatches(schema => has(schema, "lookup"))
    // schemaMatches(schema => isFunction(get(schema, "lookup.search")))
  ),
};
</script>
