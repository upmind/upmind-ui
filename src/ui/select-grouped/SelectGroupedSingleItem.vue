<template>
  <li
    ref="rootRef"
    :class="
      cn(styles.selectGrouped.group.root, styles.selectGrouped.group.size)
    "
    role="radio"
    :aria-checked="isSelected"
    :aria-disabled="props.disabled"
    :tabindex="
      props.disabled ? -1 : props.index === props.focusedGroupIndex ? 0 : -1
    "
    :data-state="isSelected ? 'checked' : 'unchecked'"
    @focus="handleFocus"
    @click="toggleSelection"
    @keydown.enter="toggleSelection"
    @keydown.space.prevent="toggleSelection"
    @keydown.down.prevent="emits('focus-next-group')"
    @keydown.up.prevent="emits('focus-prev-group')"
  >
    <span :class="styles.selectGrouped.radio">
      <span :class="styles.selectGrouped.indicator">
        <Circle v-if="isSelected" :class="styles.selectGrouped.indicatorDot" />
      </span>
    </span>
    <slot
      name="item"
      v-bind="{ item: props.item, group: props.group, selected: isSelected }"
    >
      <SelectGroupedItemContent :item="props.item" />
    </slot>
  </li>
</template>

<script setup lang="ts">
/**
 * Renders options with only one item.
 *
 * Displays as a directly selectable radio option with label, description,
 * badges, and optional action button. Used when a group contains exactly
 * one item, eliminating the need for a dropdown.
 */
// --- external
import { useFocus } from "@vueuse/core";
import { Circle } from "lucide-vue-next";
import { computed, ref } from "vue";
// --- internal
import config from "./selectGrouped.config";
import SelectGroupedItemContent from "./SelectGroupedItemContent.vue";
import { toggleSelectionValue } from "./utils";
import { cn, useStyles } from "../../utils";
// --- components
import { isArray, includes, isEqual } from "lodash-es";
import type { SelectGroupedSingleItemRendererProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<SelectGroupedSingleItemRendererProps>(),
  {
    index: 0,
    focusedGroupIndex: 0
  }
);

const emits = defineEmits<{
  "update:modelValue": [value: string];
  "focus-next-group": [];
  "focus-prev-group": [];
}>();

const rootRef = ref<HTMLElement | null>(null);
const { focused } = useFocus(rootRef);

const isSelected = computed(() => {
  if (isArray(props.modelValue)) {
    return includes(props.modelValue, props.item.value);
  }
  return isEqual(props.modelValue, props.item.value);
});

const meta = computed(() => ({
  hasSelection: isSelected
}));

const styles = useStyles<typeof config>(
  [
    "selectGrouped",
    "selectGrouped.group",
    "selectGrouped.content",
    "selectGrouped.indicator",
    "selectGrouped.indicatorDot"
  ],
  meta,
  config,
  props.uiConfig ?? {}
);
// --- Methods

function toggleSelection() {
  const newValue = toggleSelectionValue({
    currentValue: props.modelValue,
    itemValue: props.item.value,
    required: props.required,
    disabled: props.disabled
  });

  if (newValue !== null) {
    emits("update:modelValue", newValue);
  }
}

// Auto-select when receiving focus (from arrow key navigation)
function handleFocus() {
  if (!isSelected.value) {
    toggleSelection();
  }
}

// Expose setFocus method for parent navigation
defineExpose({
  setFocus: () => (focused.value = true)
});
</script>
