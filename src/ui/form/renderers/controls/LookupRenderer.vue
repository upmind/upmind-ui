<template>
  <FormField v-bind="formFieldProps">
    <Autocomplete
      :align="appliedOptions?.align"
      :auto-focus="appliedOptions?.autoFocus"
      :item-label="appliedOptions?.itemLabel"
      :item-value="appliedOptions?.itemValue"
      :items="control?.options || appliedOptions?.items"
      :model-value="control.data"
      :placeholder="appliedOptions?.placeholder"
      :search="doSearch"
      :side="appliedOptions?.side"
      @update:modelValue="onInput"
      width="full"
    />
  </FormField>
</template>

<script lang="ts" setup>
import { schemaMatches, uiTypeIs, and } from "@jsonforms/core";
import { useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
import { Autocomplete } from "../../../autocomplete";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { has, get } from "lodash-es";
import type { AutocompleteSearchFunction } from "../../../autocomplete";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput, formFieldProps } =
  useUpmindUIRenderer(useJsonFormsOneOfEnumControl(props));

const doSearch: AutocompleteSearchFunction | undefined = get(
  control.value,
  "schema.lookup"
);
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(
    uiTypeIs("Control"),
    schemaMatches(schema => has(schema, "lookup"))
    // schemaMatches(schema => isFunction(get(schema, "lookup.search")))
  )
};
</script>
