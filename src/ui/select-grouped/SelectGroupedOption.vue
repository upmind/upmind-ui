<template>
  <SelectGroupedSingleItem
    v-if="isSingleItem"
    ref="singleItemRef"
    :item="singleItem!"
    :group="props.group"
    :index="props.index"
    :focused-group-index="props.focusedGroupIndex"
    :model-value="props.modelValue"
    :required="props.required"
    :disabled="props.disabled"
    :ui-config="props.uiConfig"
    @update:model-value="onChange"
    @action="onAction"
    @focus-next-group="() => emits('focus-next-group')"
    @focus-prev-group="() => emits('focus-prev-group')"
  >
    <template v-if="$slots.item" #item="slotProps">
      <slot name="item" v-bind="slotProps" />
    </template>
  </SelectGroupedSingleItem>

  <SelectGroupedMultiItem
    v-else
    ref="multiItemRef"
    :group="props.group"
    :index="props.index"
    :focused-group-index="props.focusedGroupIndex"
    :model-value="props.modelValue"
    :required="props.required"
    :disabled="props.disabled"
    :ui-config="props.uiConfig"
    @update:model-value="onChange"
    @action="onAction"
    @focus-next-group="() => emits('focus-next-group')"
    @focus-prev-group="() => emits('focus-prev-group')"
  >
    <template v-if="$slots.icon" #icon="slotProps">
      <slot name="icon" v-bind="slotProps" />
    </template>
    <template v-if="$slots.header" #header="slotProps">
      <slot name="header" v-bind="slotProps" />
    </template>
    <template v-if="$slots['header-label']" #header-label="slotProps">
      <slot name="header-label" v-bind="slotProps" />
    </template>
    <template v-if="$slots['dropdown-item']" #dropdown-item="slotProps">
      <slot name="dropdown-item" v-bind="slotProps" />
    </template>
  </SelectGroupedMultiItem>
</template>

<script setup lang="ts">
/**
 * Selects the appropriate renderer.
 *
 * Decides whether to render a SingleItem (for groups with exactly one item) or
 * a MultiItem (for groups with multiple items that need a dropdown). Forwards
 * all slots and events to the appropriate child component.
 */
// --- external
import { computed, ref } from "vue";

// --- components
import SelectGroupedSingleItem from "./SelectGroupedSingleItem.vue";
import SelectGroupedMultiItem from "./SelectGroupedMultiItem.vue";

// --- types
import type { SelectGroupedOptionRendererProps } from "./types";
import { first } from "lodash-es";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SelectGroupedOptionRendererProps>(), {
  index: 0,
  focusedGroupIndex: 0
});

const emits = defineEmits<{
  "update:modelValue": [value: string];
  action: [{ name: string; event: Event }];
  "focus-next-group": [];
  "focus-prev-group": [];
}>();

// --- Refs

const singleItemRef = ref<{ setFocus: () => void } | null>(null);
const multiItemRef = ref<{ setFocus: () => void } | null>(null);

// --- Computed

const isSingleItem = computed(() => props.group.items.length === 1);
const singleItem = computed(() => first(props.group.items));

// --- Methods

const onChange = (value: string) => {
  emits("update:modelValue", value);
};

const onAction = (value: { name: string; event: Event }) => {
  emits("action", value);
};

// Expose setFocus method for parent navigation
defineExpose({
  setFocus: () => {
    if (isSingleItem.value) {
      singleItemRef.value?.setFocus();
    } else {
      multiItemRef.value?.setFocus();
    }
  }
});
</script>
