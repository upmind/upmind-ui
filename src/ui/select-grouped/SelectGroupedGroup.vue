<template>
  <SelectGroupedSingleItem
    v-if="isSingleItem"
    :item="singleItem!"
    :group="props.group"
    :model-value="modelValue"
    :multiple="props.multiple"
    :required="props.required"
    :disabled="props.disabled"
    :columns="props.columns"
    :data-hover="props.dataHover"
    :data-focus="props.dataFocus"
    @update:model-value="onChange"
    @action="onAction"
  >
    <template v-if="$slots.item" #item="slotProps">
      <slot name="item" v-bind="slotProps" />
    </template>
  </SelectGroupedSingleItem>

  <SelectGroupedMultiItem
    v-else
    :group="props.group"
    :model-value="modelValue"
    :multiple="props.multiple"
    :required="props.required"
    :disabled="props.disabled"
    :columns="props.columns"
    :data-hover="props.dataHover"
    :data-focus="props.dataFocus"
    @update:model-value="onChange"
  >
    <template v-if="$slots.header" #header="slotProps">
      <slot name="header" v-bind="slotProps" />
    </template>
    <template v-if="$slots['dropdown-item']" #dropdown-item="slotProps">
      <slot name="dropdown-item" v-bind="slotProps" />
    </template>
  </SelectGroupedMultiItem>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- components
import SelectGroupedSingleItem from "./SelectGroupedSingleItem.vue";
import SelectGroupedMultiItem from "./SelectGroupedMultiItem.vue";

// --- types
import type { SelectGroupedGroupProps } from "./types";
import { first } from "lodash-es";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    group: SelectGroupedGroupProps;
    modelValue?: string | string[];
    multiple?: boolean;
    required?: boolean;
    disabled?: boolean;
    columns?: number;
    dataHover?: boolean;
    dataFocus?: boolean;
  }>(),
  {
    columns: 1
  }
);

const emits = defineEmits<{
  "update:modelValue": [value: string | string[]];
  action: [{ name: string; event: Event }];
}>();

// --- Computed

const isSingleItem = computed(() => props.group.items.length === 1);
const singleItem = computed(() => first(props.group.items));

// --- Methods

const onChange = (value: string | string[]) => {
  emits("update:modelValue", value);
};

const onAction = (value: { name: string; event: Event }) => {
  emits("action", value);
};
</script>
