<template>
  <li
    ref="rootRef"
    :class="styles.selectGrouped.dropdown.item"
    role="option"
    :aria-selected="isSelected"
    :data-state="isSelected ? 'checked' : 'unchecked'"
    :data-focused="props.focused"
    :tabindex="props.focused ? 0 : -1"
    @click="$emit('select', props.item.value)"
    @keydown.enter="$emit('select', props.item.value)"
    @keydown.space.prevent="$emit('select', props.item.value)"
    @keydown.down.prevent="$emit('focusNext')"
    @keydown.up.prevent="$emit('focusPrev')"
  >
    <slot name="item" v-bind="{ item: props.item, selected: isSelected }">
      <SelectGroupedItemContent :item="props.item" />
    </slot>
  </li>
</template>

<script setup lang="ts">
/**
 * Individual item within a dropdown list.
 *
 * Renders a single selectable row inside the MultiItem dropdown. Displays
 * label, description, badges, and optional action button. Emits selection
 * and action events to the parent MultiItem component.
 */
// --- external
import { useFocus } from "@vueuse/core";
import { computed, ref } from "vue";
// --- internal
import config from "./selectGrouped.config";
// --- components
import SelectGroupedItemContent from "./SelectGroupedItemContent.vue";
import { useStyles } from "../../utils";
import { isArray, includes, isEqual } from "lodash-es";
import type { SelectGroupedDropdownItemProps } from "./types";
// -----------------------------------------------------------------------------

const props = defineProps<SelectGroupedDropdownItemProps>();

const _emits = defineEmits<{
  select: [value: string];
  focusNext: [];
  focusPrev: [];
}>();

const rootRef = ref<HTMLElement | null>(null);
const { focused } = useFocus(rootRef);

const isSelected = computed(() => {
  if (isArray(props.modelValue)) {
    return includes(props.modelValue, props.item.value);
  }
  return isEqual(props.modelValue, props.item.value);
});

// Expose setFocus method for parent focus management
defineExpose({
  setFocus: () => (focused.value = true)
});

const meta = computed(() => ({}));

const styles = useStyles<typeof config>(
  ["selectGrouped", "selectGrouped.dropdown", "selectGrouped.content"],
  meta,
  config,
  {}
);
</script>
