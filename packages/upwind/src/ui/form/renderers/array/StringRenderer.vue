<template>
  <FormField v-bind="delegatedProps">
    <CheckboxCards
      :model-value="control.data"
      :items="control.options"
      @update:modelValue="onInput"
      multiple
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useJsonFormsMultiEnumControl } from "@jsonforms/vue";

// --- components
import FormField from "../../FormField.vue";
import { CheckboxCards } from "../../../checkbox-cards";

// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// ----------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput } = useUpwindRenderer({
  ...useJsonFormsMultiEnumControl(props),
  handleChange: () => {
    debugger;
  }, // Provide a default handleChange function
});

const delegatedProps = computed(() => {
  const options = appliedOptions.value || {};

  return {
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
import {
  uiTypeIs,
  and,
  schemaMatches,
  hasType,
  schemaSubPathMatches,
} from "@jsonforms/core";

const hasOneOfItems = (schema: JsonSchema) =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema: JsonSchema) =>
  schema.type === "string" && schema.enum !== undefined;

export const tester = {
  rank: 5,
  controlType: and(
    uiTypeIs("Control"),
    and(
      schemaMatches(
        schema =>
          hasType(schema, "array") &&
          !Array.isArray(schema.items) &&
          schema.uniqueItems === true
      ),
      schemaSubPathMatches("items", schema => {
        return hasOneOfItems(schema) || hasEnumItems(schema);
      })
    )
  ),
};
</script>
