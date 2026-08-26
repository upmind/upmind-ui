<template>
  <FormField v-bind="formFieldProps">
    <Combobox
      v-model:open="open"
      :model-value="control.data"
      class="w-full"
      :items="items"
      :display-value="displayValue"
      :placeholder="appliedOptions?.placeholder"
      :empty-label="t('text.no_results')"
      :ui="{ input: 'flex-1' }"
      reset-search-term-on-blur
      @update:model-value="onInput"
      @focus="open = true"
    />
  </FormField>
</template>

<script lang="ts" setup>
import { schemaMatches, uiTypeIs, and } from "@jsonforms/core";
import { useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
import { Combobox } from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { has, find } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
interface LookupItem {
  value: string;
  label: string;
}

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput, formFieldProps } =
  useUpmindUIRenderer(useJsonFormsOneOfEnumControl(props));

const { t } = useI18n();
const open = ref(false);

// reka filters the rendered options client-side as the user types. NB the old
// Autocomplete also accepted an async `schema.lookup.search`; server-side lookup
// isn't wired here — confirm on the dev server whether any field needs it.
const items = computed<LookupItem[]>(
  () => control.value?.options || appliedOptions.value?.items || []
);

function displayValue(value: unknown) {
  return find(items.value, i => i.value === value)?.label ?? "";
}
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(
    uiTypeIs("Control"),
    schemaMatches(schema => has(schema, "lookup"))
  )
};
</script>
