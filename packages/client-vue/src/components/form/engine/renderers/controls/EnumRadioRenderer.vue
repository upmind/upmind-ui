<template>
  <FormField v-bind="formFieldProps">
    <OptionTileGroup
      :name="control.path"
      :model-value="control.data"
      mode="single"
      :layout="layout"
      :min-tile-width="minTileWidth"
      data-test-key="option-tile-group"
      @update:model-value="onInput"
    >
      <OptionTile
        v-for="item in items"
        :key="String(item.value)"
        :data-attrs="{ 'data-test-key': `option-tile-${item.value}` }"
        :value="item.value"
        :label="item.label"
        :description="item.secondaryLabel"
      />
    </OptionTileGroup>
  </FormField>
</template>

<script lang="ts" setup>
import { isEnumControl, and, optionIs } from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { computed } from "vue";
import { OptionTileGroup, OptionTile } from "@upmind/ui";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { map, get } from "lodash-es";
import type { ControlElement, EnumOption, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
interface EnumTile {
  value: string;
  label: string;
  secondaryLabel?: string;
}

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

// Old RadioCards used a fixed column count; the new grid auto-fits by min tile
// width. >1 column → a corner-marked grid, single column → a leading-marked stack.
const columns = computed(() => appliedOptions.value?.width ?? 1);
const isGrid = computed(() => columns.value > 1);
const layout = computed(() => {
  if (isGrid.value) return "grid";
  return "stack";
});
const minTileWidth = computed(() => {
  if (columns.value >= 3) return "12rem";
  return "16rem";
});

const items = computed<EnumTile[]>(() => {
  const { options, schema } = control.value as {
    options: (EnumOption & { text?: string })[];
    schema: JsonSchema & { options?: (EnumOption & { text?: string })[] };
  };

  return map(
    schema.options ?? options,
    (option): EnumTile => ({
      value: option.value,
      label: option.label,
      secondaryLabel: get(option, "text")
    })
  );
});
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(isEnumControl, optionIs("format", "radio"))
};
</script>
