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
      <div class="flex w-full items-center justify-between gap-4">
        <div class="flex flex-1 flex-col">
          <span :class="styles.selectGrouped.content.label">
            {{ props.item.label }}
          </span>
          <Badge v-if="props.item.badge" v-bind="props.item.badge" size="sm" />
          <p
            v-if="props.item.description"
            :class="styles.selectGrouped.content.description"
          >
            {{ props.item.description }}
          </p>
        </div>
        <div class="flex flex-col items-end">
          <span :class="styles.selectGrouped.content.secondaryLabel">
            {{ props.item.secondaryLabel }}
          </span>
          <Badge
            v-if="props.item.secondaryBadge"
            v-bind="props.item.secondaryBadge"
            size="sm"
          />
          <p
            v-if="props.item.secondaryDescription"
            :class="styles.selectGrouped.content.secondaryDescription"
          >
            {{ props.item.secondaryDescription }}
          </p>
          <Link
            v-if="props.item.action"
            v-show="
              isNil(props.item.action?.visible) || props.item.action?.visible
            "
            v-bind="props.item.action"
            color="muted"
            size="sm"
            @click.stop="doAction(props.item.action, $event)"
          />
        </div>
      </div>
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
import { handleItemAction } from "./utils";

// --- components
import { Link } from "../link";
import { Badge } from "../badge";

// --- types
import type {
  SelectGroupedDropdownItemProps,
  SelectGroupedItemActionProps
} from "./types";
import { isNil, isArray } from "lodash-es";

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

function doAction(action: SelectGroupedItemActionProps, $event: Event) {
  const result = handleItemAction(action, $event);
  if (result) {
    emits("action", result);
  }
}
</script>
