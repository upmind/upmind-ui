<template>
  <div
    :class="
      cn(styles.selectGrouped.group.root, styles.selectGrouped.group.size)
    "
    :role="props.multiple ? 'checkbox' : 'radio'"
    :aria-checked="isSelected"
    :aria-disabled="props.disabled"
    :tabindex="props.disabled ? -1 : 0"
    :data-state="isSelected ? 'checked' : 'unchecked'"
    :data-hover="props.dataHover"
    :data-focus="props.dataFocus"
    @click="toggleSelection"
    @keydown.enter="toggleSelection"
    @keydown.space.prevent="toggleSelection"
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
// --- external
import { computed } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectGrouped.config";

// --- components
import { Badge } from "../badge";
import { Link } from "../link";
import { Circle } from "lucide-vue-next";

// --- types
import type {
  SelectGroupedGroupProps,
  SelectGroupedItemProps,
  SelectGroupedItemActionProps
} from "./types";
import { isFunction, isString, isNil } from "lodash-es";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    item: SelectGroupedItemProps;
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

const isSelected = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.item.value);
  }
  return props.modelValue === props.item.value;
});

const meta = computed(() => ({
  columns: props.columns,
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
  {}
);

// --- Methods

function toggleSelection() {
  if (props.disabled) return;

  if (props.multiple) {
    const currentValue = Array.isArray(props.modelValue)
      ? [...props.modelValue]
      : [];
    const index = currentValue.indexOf(props.item.value);
    if (index > -1) {
      if (!props.required || currentValue.length > 1) {
        currentValue.splice(index, 1);
      }
    } else {
      currentValue.push(props.item.value);
    }
    emits("update:modelValue", currentValue);
  } else {
    if (props.modelValue === props.item.value && !props.required) {
      emits("update:modelValue", "");
    } else {
      emits("update:modelValue", props.item.value);
    }
  }
}

function doAction(action: SelectGroupedItemActionProps, $event: Event) {
  $event.preventDefault();
  $event.stopPropagation();

  if (isFunction(action.handler)) {
    action.handler($event);
    return;
  }

  if (isString(action.handler)) {
    emits("action", {
      name: action.handler,
      event: $event
    });
  }
}
</script>
