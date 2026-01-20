<template>
  <div
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
      <SelectGroupedItemContent
        :item="props.item"
        @action="v => emits('action', v)"
      />
    </slot>
  </div>
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
import { computed, ref } from "vue";
import { useFocus } from "@vueuse/core";

// --- internal
import { useStyles } from "../../utils";
import config from "./selectGrouped.config";

// --- components
import SelectGroupedItemContent from "./SelectGroupedItemContent.vue";

import type { SelectGroupedDropdownItemProps } from "./types";
import { isArray } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps<SelectGroupedDropdownItemProps>();

const emits = defineEmits<{
  select: [value: string];
  action: [{ name: string; event: Event }];
  focusNext: [];
  focusPrev: [];
}>();

const rootRef = ref<HTMLElement | null>(null);
const { focused } = useFocus(rootRef);

const isSelected = computed(() => {
  if (isArray(props.modelValue)) {
    return props.modelValue.includes(props.item.value);
  }
  return props.modelValue === props.item.value;
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
