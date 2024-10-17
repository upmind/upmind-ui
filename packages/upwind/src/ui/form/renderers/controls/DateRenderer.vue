<template>
  <FormField v-bind="delegatedProps">
    <Input
      :disabled="!control.enabled"
      :model-value="control.data"
      @update:modelValue="onInput"
      :type="isDateTime ? 'datetime-local' : 'date'"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";
import { isArray, includes } from "lodash-es";
// --- components
import FormField from "../../FormField.vue";
import { Input } from "../../../input";

// --- utils
import { useUpwindRenderer } from "../utils";
import { get } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput } = useUpwindRenderer(
  useJsonFormsControl(props)
);

const delegatedProps = computed(() => {
  const options = get(appliedOptions.value, "options", {});

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

const isDateTime = computed(() => {
  const type = control.value.schema.type;
  const format = control.value.schema?.format;
  const typeArray = isArray(type) ? type : type ? [type] : [];
  const formatArray = isArray(format) ? format : format ? [format] : [];

  return includes(typeArray, "string") && includes(formatArray, "date-time");
});
</script>

<script lang="ts">
import { and, isStringControl, or, optionIs } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(
    isStringControl,
    or(optionIs("format", "date"), optionIs("format", "date-time"))
  ),
};
</script>
