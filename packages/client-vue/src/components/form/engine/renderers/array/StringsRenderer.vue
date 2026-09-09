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
import { OptionTileGroup, OptionTile } from "@upmind/ui";
import { computed } from "vue";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { difference, forEach } from "lodash-es";
import type { ControlElement, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const multiEnumControl = useJsonFormsMultiEnumControl(props);

/**
 * `useJsonFormsMultiEnumControl` dispatches via `addItem`/`removeItem` (one
 * value at a time) and never returns a `handleChange` — `useUpmindUIRenderer`
 * requires one, so this replays the tile group's whole-next-selection write
 * as the add/remove calls JSONForms' multi-enum control actually understands.
 */
const handleChange = (path: string, value: unknown) => {
  const next = Array.isArray(value) ? value : [];
  const current = Array.isArray(multiEnumControl.control.value.data)
    ? multiEnumControl.control.value.data
    : [];

  forEach(difference(next, current), item =>
    multiEnumControl.addItem(path, item)
  );
  forEach(difference(current, next), item =>
    multiEnumControl.removeItem?.(path, item)
  );
};

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer({
    ...multiEnumControl,
    handleChange
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
