<template>
  <div
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
      <div class="flex w-full items-start gap-4">
        <span class="flex flex-1 flex-col">
          <header
            v-if="props.item?.label || props.item?.secondaryLabel"
            class="flex justify-between"
          >
            <span class="flex gap-2">
              <h5 :class="styles.selectGrouped.content.label">
                {{ props.item?.label }}
              </h5>
              <Badge
                v-if="props.item?.badge"
                v-bind="props.item.badge"
                size="sm"
              />
            </span>
            <span class="flex gap-2">
              <Badge
                v-if="props.item?.secondaryBadge"
                v-bind="props.item.secondaryBadge"
                size="sm"
              />
              <h5 :class="styles.selectGrouped.content.secondaryLabel">
                {{ props.item?.secondaryLabel }}
              </h5>
            </span>
          </header>
          <p
            v-if="props.item?.description"
            :class="styles.selectGrouped.content.description"
          >
            {{ props.item?.description }}
          </p>
          <p
            v-if="props.item?.secondaryDescription"
            :class="styles.selectGrouped.content.secondaryDescription"
          >
            {{ props.item?.secondaryDescription }}
          </p>
        </span>
        <span v-if="props.item?.action" class="leading-none">
          <Link
            v-show="
              isNil(props.item.action?.visible) || props.item.action?.visible
            "
            v-bind="props.item.action"
            color="muted"
            size="sm"
            @click.stop="doAction(props.item.action, $event)"
          />
        </span>
      </div>
    </slot>
  </div>
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
import { computed, ref } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectGrouped.config";
import { toggleSelectionValue, handleItemAction } from "./utils";

// --- components
import { Badge } from "../badge";
import { Link } from "../link";
import { Circle } from "lucide-vue-next";

// --- types
import type {
  SelectGroupedSingleItemRendererProps,
  SelectGroupedItemActionProps
} from "./types";
import { isNil, isArray } from "lodash-es";

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
  action: [{ name: string; event: Event }];
  "focus-next-group": [];
  "focus-prev-group": [];
}>();

const rootRef = ref<HTMLElement | null>(null);

const isSelected = computed(() => {
  if (isArray(props.modelValue)) {
    return props.modelValue.includes(props.item.value);
  }
  return props.modelValue === props.item.value;
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

function doAction(action: SelectGroupedItemActionProps, $event: Event) {
  const result = handleItemAction(action, $event);
  if (result) {
    emits("action", result);
  }
}

// Auto-select when receiving focus (from arrow key navigation)
function handleFocus() {
  if (!isSelected.value) {
    toggleSelection();
  }
}

// Expose focus method for parent navigation
defineExpose({
  focus: () => rootRef.value?.focus()
});
</script>
