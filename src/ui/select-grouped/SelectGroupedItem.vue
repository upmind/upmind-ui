<template>
  <div
    :class="styles.selectGrouped.dropdown.item"
    role="option"
    :aria-selected="isSelected"
    :data-state="isSelected ? 'checked' : 'unchecked'"
    :tabindex="isSelected ? 0 : -1"
    @click="$emit('select', props.item.value)"
    @keydown.enter="$emit('select', props.item.value)"
    @keydown.space.prevent="$emit('select', props.item.value)"
  >
    <slot name="item" v-bind="{ item: props.item, selected: isSelected }">
      <div class="flex w-full items-start gap-4">
        <span class="flex flex-1 flex-col">
          <header
            v-if="props.item.label || props.item.secondaryLabel"
            class="flex justify-between"
          >
            <span class="flex gap-2">
              <h5 :class="styles.selectGrouped.content.label">
                {{ props.item.label }}
              </h5>
              <Badge
                v-if="props.item.badge"
                v-bind="props.item.badge"
                size="sm"
              />
            </span>
            <span class="flex gap-2">
              <Badge
                v-if="props.item.secondaryBadge"
                v-bind="props.item.secondaryBadge"
                size="sm"
              />
              <h5 :class="styles.selectGrouped.content.secondaryLabel">
                {{ props.item.secondaryLabel }}
              </h5>
            </span>
          </header>
          <p
            v-if="props.item.description"
            :class="styles.selectGrouped.content.description"
          >
            {{ props.item.description }}
          </p>
          <p
            v-if="props.item.secondaryDescription"
            :class="styles.selectGrouped.content.secondaryDescription"
          >
            {{ props.item.secondaryDescription }}
          </p>
        </span>
        <span v-if="props.item.action" class="leading-none">
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
import { Link } from "../link";
import { Badge } from "../badge";

// --- types
import type {
  SelectGroupedItemProps,
  SelectGroupedItemActionProps
} from "./types";
import { isFunction, isString, isNil, isArray } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps<{
  item: SelectGroupedItemProps;
  modelValue?: string | string[];
  multiple?: boolean;
}>();

const emits = defineEmits<{
  select: [value: string];
  action: [{ name: string; event: Event }];
}>();

const isSelected = computed(() => {
  if (isArray(props.modelValue)) {
    return props.modelValue.includes(props.item.value);
  }
  return props.modelValue === props.item.value;
});

const meta = computed(() => ({}));

const styles = useStyles<typeof config>(
  ["selectGrouped", "selectGrouped.dropdown", "selectGrouped.content"],
  meta,
  config,
  {}
);

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
    return;
  }
}
</script>
