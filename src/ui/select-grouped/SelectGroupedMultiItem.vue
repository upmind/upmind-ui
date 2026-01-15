<template>
  <div class="relative" :class="styles.selectGrouped.group.size">
    <Collapsible v-model:open="isOpen">
      <!-- Collapsible header/trigger -->
      <div
        ref="headerRef"
        :class="styles.selectGrouped.group.root"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-haspopup="'listbox'"
        :aria-controls="`dropdown-${groupId}`"
        :aria-disabled="props.disabled"
        :tabindex="
          props.disabled ? -1 : props.index === props.focusedGroupIndex ? 0 : -1
        "
        :data-state="hasSelection ? 'checked' : 'unchecked'"
        :data-hover="props.dataHover"
        :data-focus="props.dataFocus"
        @blur="handleBlur"
        @click="toggleOpen"
        @keydown.enter.prevent="handleEnterSpace"
        @keydown.space.prevent="handleEnterSpace"
        @keydown.escape="isOpen = false"
        @keydown.down.prevent="handleArrowDown"
        @keydown.up.prevent="handleArrowUp"
      >
        <span :class="styles.selectGrouped.radio">
          <span :class="styles.selectGrouped.indicator">
            <Circle
              v-if="hasSelection"
              :class="styles.selectGrouped.indicatorDot"
            />
          </span>
        </span>
        <slot
          name="header"
          v-bind="{ group: props.group, selectedItem, expanded: isOpen }"
        >
          <div :class="styles.selectGrouped.header.root">
            <div class="flex flex-1 flex-col">
              <div class="flex items-center gap-2">
                <h5 :class="styles.selectGrouped.content.label">
                  {{ props.group.name }}
                </h5>
                <span
                  v-if="selectedItem?.label"
                  :class="styles.selectGrouped.content.secondaryLabel"
                >
                  {{ selectedItem.label }}
                </span>
              </div>
              <p
                v-if="props.group.description"
                :class="styles.selectGrouped.content.description"
              >
                {{ props.group.description }}
              </p>
            </div>
            <Icon
              icon="chevron-down"
              :class="
                cn(styles.selectGrouped.header.chevron, isOpen && 'rotate-180')
              "
            />
          </div>
        </slot>
      </div>

      <!-- Dropdown content -->
      <CollapsibleContent>
        <div
          :id="`dropdown-${groupId}`"
          role="listbox"
          :aria-label="props.group.name || 'Options'"
          :class="styles.selectGrouped.dropdown.root"
        >
          <SelectGroupedItem
            v-for="(item, index) in props.group.items"
            :key="item.value"
            :item="item"
            :model-value="modelValue"
            :multiple="props.multiple"
            :focused="focusedIndex === index"
            @select="onItemSelect"
          >
            <template v-if="$slots['dropdown-item']" #item="slotProps">
              <slot
                name="dropdown-item"
                v-bind="{ ...slotProps, group: props.group }"
              />
            </template>
          </SelectGroupedItem>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
import { useId } from "radix-vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectGrouped.config";

// --- components
import { Collapsible, CollapsibleContent } from "../collapsible";
import { Icon } from "../icon";
import { Circle } from "lucide-vue-next";
import SelectGroupedItem from "./SelectGroupedItem.vue";

// --- types
import type { SelectGroupedGroupProps, SelectGroupedItemProps } from "./types";
import { first, isArray, without, isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    group: SelectGroupedGroupProps;
    index?: number;
    focusedGroupIndex?: number;
    modelValue?: string | string[];
    multiple?: boolean;
    required?: boolean;
    disabled?: boolean;
    columns?: number;
    dataHover?: boolean;
    dataFocus?: boolean;
  }>(),
  {
    index: 0,
    focusedGroupIndex: 0,
    columns: 1
  }
);

const emits = defineEmits<{
  "update:modelValue": [value: string | string[]];
  "focus-next-group": [];
  "focus-prev-group": [];
}>();

const groupId = useId();
const isOpen = ref(false);
const focusedIndex = ref(0);
const headerRef = ref<HTMLElement | null>(null);

const selectedItem = computed<SelectGroupedItemProps | undefined>(() => {
  if (isArray(props.modelValue)) {
    return props.group.items.find(item =>
      props.modelValue?.includes(item.value)
    );
  }
  return props.group.items.find(item => item.value === props.modelValue);
});

const hasSelection = computed(() => {
  return props.group.items.some(item => {
    if (isArray(props.modelValue)) {
      return props.modelValue.includes(item.value);
    }
    return item.value === props.modelValue;
  });
});

const meta = computed(() => ({
  columns: props.columns,
  isOpen,
  hasSelection
}));

const styles = useStyles<typeof config>(
  [
    "selectGrouped",
    "selectGrouped.group",
    "selectGrouped.header",
    "selectGrouped.dropdown",
    "selectGrouped.content",
    "selectGrouped.indicator",
    "selectGrouped.indicatorDot"
  ],
  meta,
  config,
  {}
);

// --- Methods

/**
 * Toggle selection of a value. Handles both single and multiple selection modes.
 */
function toggleSelection(value: string) {
  if (props.disabled) return;

  if (props.multiple) {
    // Multiple selection mode: add/remove from array
    const current = isArray(props.modelValue) ? [...props.modelValue] : [];
    const isSelected = current.includes(value);

    if (isSelected) {
      // Deselect: only allow if not required or there are other selections
      if (!props.required || current.length > 1) {
        emits("update:modelValue", without(current, value));
      }
    } else {
      // Select: add to current selections
      emits("update:modelValue", [...current, value]);
    }
  } else {
    // Single selection mode: toggle or set value
    const isSelected = props.modelValue === value;
    // Deselect if already selected and not required, otherwise select
    const newValue = isSelected && !props.required ? "" : value;
    emits("update:modelValue", newValue);
  }
}

function toggleOpen() {
  if (props.disabled) return;

  isOpen.value = !isOpen.value;

  // Set visual focus to first item when opening
  if (isOpen.value) {
    focusedIndex.value = 0;
  }
}

function onItemSelect(value: string) {
  toggleSelection(value);
  if (!props.multiple) {
    isOpen.value = false;
  }
}

/**
 * Move visual focus to item at index (without selecting)
 */
function focusItem(index: number) {
  focusedIndex.value = Math.max(
    0,
    Math.min(index, props.group.items.length - 1)
  );
}

/**
 * Select the currently focused item
 */
function selectFocusedItem() {
  const item = props.group.items[focusedIndex.value];
  if (item) {
    toggleSelection(item.value);
    if (!props.multiple) {
      isOpen.value = false;
    }
  }
}

function handleBlur() {
  isOpen.value = false;
}

function handleEnterSpace() {
  if (isOpen.value) {
    selectFocusedItem();
  } else {
    toggleOpen();
  }
}

function handleArrowDown() {
  if (!isOpen.value) {
    // Navigate to next group when dropdown is closed
    emits("focus-next-group");
  } else {
    // Navigate to next item within dropdown
    focusItem(focusedIndex.value + 1);
  }
}

function handleArrowUp() {
  if (!isOpen.value) {
    // Navigate to previous group when dropdown is closed
    emits("focus-prev-group");
  } else {
    // Navigate to previous item within dropdown
    focusItem(focusedIndex.value - 1);
  }
}

// Expose focus method for parent navigation
defineExpose({
  focus: () => headerRef.value?.focus()
});
</script>
