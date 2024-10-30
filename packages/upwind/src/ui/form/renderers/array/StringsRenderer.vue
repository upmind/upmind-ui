<template>
  <FormField v-bind="formFieldProps">
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

const { control, formFieldProps, onInput } = useUpwindRenderer({
  ...useJsonFormsMultiEnumControl(props),
  handleChange: () => {
    debugger;
  }, // Provide a default handleChange function
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
