<template>
  <div
    ref="containerRef"
    class="relative"
    :class="styles.selectGrouped.group.size"
    @focusout="handleFocusOut"
  >
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
        @focus="handleFocus"
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
            <slot name="icon" v-bind="{ group: props.group }" />
            <div class="flex flex-1 flex-col">
              <div class="flex items-center gap-2">
                <span :class="styles.selectGrouped.content.label">
                  {{ props.group.name }}
                </span>
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
            <slot
              name="header-label"
              v-bind="{ group: props.group, selectedItem, expanded: isOpen }"
            />
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
            :model-value="props.modelValue"
            :focused="focusedIndex === index"
            @select="onItemSelect"
            @action="onAction"
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
/**
 * Renders options with multiple items as a dropdown.
 *
 * Displays as a collapsible header that expands to show a list of selectable
 * items. Manages keyboard navigation within the dropdown, focus states, and
 * selection. The header shows the currently selected item's label.
 */
// --- external
import { computed, ref } from "vue";
import { useId } from "radix-vue";
import { useFocus } from "@vueuse/core";

// --- internal
import {
  cn,
  useStyles,
  useListNavigation,
  createFocusOutHandler
} from "../../utils";
import config from "./selectGrouped.config";
import { toggleSelectionValue } from "./utils";

// --- components
import { Collapsible, CollapsibleContent } from "../collapsible";
import { Icon } from "../icon";
import { Circle } from "lucide-vue-next";
import SelectGroupedItem from "./SelectGroupedItem.vue";

// --- types
import type {
  SelectGroupedMultiItemRendererProps,
  SelectGroupedItemProps
} from "./types";
import { isArray } from "lodash-es";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SelectGroupedMultiItemRendererProps>(), {
  index: 0,
  focusedGroupIndex: 0
});

const emits = defineEmits<{
  "update:modelValue": [value: string];
  action: [{ name: string; event: Event }];
  "focus-next-group": [];
  "focus-prev-group": [];
}>();

const groupId = useId();
const isOpen = ref(false);
const headerRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const { focused: headerFocused } = useFocus(headerRef);

const { focusedIndex, focusItem, focusNext, focusPrev, focusFirst } =
  useListNavigation(() => props.group.items.length, {
    wrap: false,
    orientation: "vertical",
    initialIndex: 0
  });

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
  props.uiConfig ?? {}
);

// --- Methods

/**
 * Toggle selection of a value using shared logic.
 */
function toggleSelection(value: string) {
  const newValue = toggleSelectionValue({
    currentValue: props.modelValue,
    itemValue: value,
    required: props.required,
    disabled: props.disabled
  });

  if (newValue !== null) {
    emits("update:modelValue", newValue);
  }
}

function onAction(payload: { name: string; event: Event }) {
  emits("action", payload);
}

function toggleOpen() {
  if (props.disabled) return;

  isOpen.value = !isOpen.value;

  // When opening, set visual focus appropriately
  if (isOpen.value) {
    if (hasSelection.value && selectedItem.value) {
      // Focus the already-selected item (don't change the value)
      const idx = props.group.items.indexOf(selectedItem.value);
      focusItem(idx >= 0 ? idx : 0);
    } else {
      // No selection - focus first item and auto-select it
      focusFirst();
      selectFocusedItem(false);
    }
  }
}

function onItemSelect(value: string) {
  toggleSelection(value);
  isOpen.value = false;
}

/**
 * Select the currently focused item
 * @param closeOnSelect - Whether to close the dropdown after selection (for single-select mode)
 */
function selectFocusedItem(closeOnSelect = true) {
  const item = props.group.items[focusedIndex.value];
  if (item) {
    toggleSelection(item.value);
    if (closeOnSelect) {
      isOpen.value = false;
    }
  }
}

// Auto-select first item when group receives focus (from arrow key navigation)
function handleFocus() {
  if (!hasSelection.value && props.group.items.length > 0) {
    focusFirst();
    selectFocusedItem(false);
  }
}

// Use the focus out handler utility
const handleFocusOut = createFocusOutHandler(containerRef, () => {
  isOpen.value = false;
});

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
    // Navigate to next item within dropdown and auto-select (don't close)
    focusNext();
    selectFocusedItem(false);
  }
}

function handleArrowUp() {
  if (!isOpen.value) {
    // Navigate to previous group when dropdown is closed
    emits("focus-prev-group");
  } else if (focusedIndex.value === 0) {
    // At first item - close dropdown and go to previous group
    isOpen.value = false;
    emits("focus-prev-group");
  } else {
    // Navigate to previous item within dropdown and auto-select (don't close)
    focusPrev();
    selectFocusedItem(false);
  }
}

// Expose focus method for parent navigation
defineExpose({
  focus: () => (headerFocused.value = true)
});
</script>
