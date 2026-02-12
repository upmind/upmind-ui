<template>
  <SelectGroupedSingleItem
    v-if="!props.group.dropdown"
    ref="singleItemRef"
    :item="singleItem!"
    v-bind="forwarded"
  >
    <template v-if="$slots.item" #item="slotProps">
      <slot name="item" v-bind="slotProps" />
    </template>
  </SelectGroupedSingleItem>

  <SelectGroupedMultiItem v-else ref="multiItemRef" v-bind="forwarded">
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
import { useForwardPropsEmits } from "radix-vue";
import { computed, ref } from "vue";
// --- components
import SelectGroupedMultiItem from "./SelectGroupedMultiItem.vue";
import SelectGroupedSingleItem from "./SelectGroupedSingleItem.vue";
// --- types
import { first } from "lodash-es";
import type { SelectGroupedOptionRendererProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SelectGroupedOptionRendererProps>(), {
  index: 0,
  focusedGroupIndex: 0
});

const emits = defineEmits<{
  "update:modelValue": [value: string];
  "focus-next-group": [];
  "focus-prev-group": [];
}>();

const forwarded = useForwardPropsEmits(props, emits);
// --- Refs

const singleItemRef = ref<{ setFocus: () => void } | null>(null);
const multiItemRef = ref<{ setFocus: () => void } | null>(null);
// --- Computed

const singleItem = computed(() => first(props.group.items));

// Expose setFocus method for parent navigation
defineExpose({
  setFocus: () => {
    if (props.group.dropdown) {
      multiItemRef.value?.setFocus();
    } else {
      singleItemRef.value?.setFocus();
    }
  }
});
</script>
