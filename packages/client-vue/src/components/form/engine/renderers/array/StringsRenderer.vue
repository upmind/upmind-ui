<template>
  <FormField v-bind="formFieldProps">
    <OptionTileGroup
      mode="multiple"
      :model-value="control.data"
      @update:model-value="onInput"
    >
      <OptionTile
        v-for="item in items"
        :key="String(item.value)"
        :value="item.value"
        :label="item.label"
      />
    </OptionTileGroup>
  </FormField>
</template>

<script lang="ts" setup>
import {
  uiTypeIs,
  and,
  schemaMatches,
  hasType,
  schemaSubPathMatches
} from "@jsonforms/core";
import { useJsonFormsMultiEnumControl } from "@jsonforms/vue";
import { computed } from "vue";
import { OptionTileGroup, OptionTile } from "@upmind/ui";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import type { ControlElement, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer({
    ...useJsonFormsMultiEnumControl(props),
    handleChange: () => {} // Provide a default handleChange function
  });

const items = computed(
  () => appliedOptions.value?.items ?? control.value.options ?? []
);
</script>

<script lang="ts">
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
  )
};
</script>
