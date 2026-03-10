<template>
  <FormField v-bind="formFieldProps" no-label>
    <CheckboxCards
      :model-value="cardValue"
      :items="appliedOptions.items ?? defaultItems"
      :disabled="!control.enabled"
      @update:modelValue="handleChange"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { isBooleanControl, and, optionIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed } from "vue";
// --- components
import { CheckboxCards } from "../../../checkbox-cards";
import FormField from "../../FormField.vue";
// --- utils
import { useUpmindUIRenderer } from "../utils";
import { isEmpty } from "lodash-es";
// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props), value => !!value);

// --- boolean ↔ string[] conversion
const CHECKED_VALUE = "true";

const isChecked = computed(
  () => control.value.data ?? control.value.schema.default ?? false
);

const cardValue = computed(() => (isChecked.value ? [CHECKED_VALUE] : []));

const defaultItems = computed(() => [
  {
    value: CHECKED_VALUE,
    label: control.value.label
  }
]);

function handleChange(value: string[]) {
  onInput(!isEmpty(value));
}
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(isBooleanControl, optionIs("format", "card"))
};
</script>
