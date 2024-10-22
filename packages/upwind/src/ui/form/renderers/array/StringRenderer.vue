<template>
  <FormField v-bind="delegatedProps">
    <CheckboxCards
      :model-value="control.data"
      :items="control.options"
      @update:modelValue="doAddRemove"
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
import { get, includes } from "lodash-es";

// --- types
import type { ControlElement, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// ----------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput } = useUpwindRenderer(
  useJsonFormsMultiEnumControl(props)
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

function doAddRemove(value: string) {
  const checked = !includes(control.value.data, value);
  onInput(checked, value);
}
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
