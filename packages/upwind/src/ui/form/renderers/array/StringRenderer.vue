<template>
  <UpwCheckboxList
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :model-value="control.data"
    :items="control.options"
    @change="onChange"
  >
  </UpwCheckboxList>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import {
  uiTypeIs,
  and,
  schemaMatches,
  hasType,
  schemaSubPathMatches,
} from "@jsonforms/core";
import { rendererProps, useJsonFormsMultiEnumControl } from "@jsonforms/vue";
// --- components
import UpwCheckboxList from "../../../checkbox/CheckboxList.vue";

// --- utils
import { useUpwindArrayRenderer } from "../utils";

// --- types
import type { ControlElement, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "ArrayStringRenderer",
  components: {
    UpwCheckboxList,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindArrayRenderer(
      useJsonFormsMultiEnumControl(props)
    );
    return {
      ...renderer,
    };
  },
});

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
