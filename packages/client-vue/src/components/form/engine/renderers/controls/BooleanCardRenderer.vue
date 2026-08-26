<template>
  <FormField v-bind="formFieldProps" no-label>
    <OptionTileGroup
      mode="multiple"
      :model-value="cardValue"
      :disabled="!control.enabled"
      data-test-key="option-tile-group"
      @update:model-value="handleChange"
    >
      <OptionTile
        v-for="item in appliedOptions.items ?? defaultItems"
        :key="String(item.value)"
        :data-attrs="
          item.dataAttrs ?? { 'data-test-key': `option-tile-${item.value}` }
        "
        :value="item.value"
        :label="item.label"
        :description="item.secondaryDescription"
      >
        <template v-if="item.badge" #label>
          {{ item.label }}
          <Badge
            :variant="item.badge.variant"
            :appearance="item.badge.appearance"
            size="sm"
            >{{ item.badge.label }}</Badge
          >
        </template>
      </OptionTile>
    </OptionTileGroup>
  </FormField>
</template>

<script lang="ts" setup>
import { isBooleanControl, and, optionIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { OptionTileGroup, OptionTile, Badge } from "@upmind/ui";
import { computed } from "vue";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { isEmpty } from "lodash-es";
import type { FormControlOptionItem } from "../../types";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props), value => !!value);

// --- boolean ↔ string[] conversion (the tile group is multi-select; this field
// is a single boolean rendered as one selectable card)
const CHECKED_VALUE = "true";

const isChecked = computed(
  () => control.value.data ?? control.value.schema.default ?? false
);

const cardValue = computed(() => (isChecked.value ? [CHECKED_VALUE] : []));

const defaultItems = computed<FormControlOptionItem[]>(() => [
  {
    value: CHECKED_VALUE,
    label: control.value.label
  }
]);

function handleChange(value: unknown) {
  onInput(!isEmpty(value as string[]));
}
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(isBooleanControl, optionIs("format", "card"))
};
</script>
