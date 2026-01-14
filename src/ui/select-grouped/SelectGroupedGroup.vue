<template>
  <!-- Single item group: render as simple selectable card -->
  <div
    v-if="isSingleItem"
    :class="
      cn(
        styles.selectGrouped.group.root,
        styles.selectGrouped.group.size,
        props.groupClass
      )
    "
    :role="props.multiple ? 'checkbox' : 'radio'"
    :aria-checked="isSelected"
    :aria-disabled="props.disabled"
    :tabindex="props.disabled ? -1 : 0"
    :data-state="isSelected ? 'checked' : 'unchecked'"
    :data-hover="props.dataHover"
    :data-focus="props.dataFocus"
    @click="toggleSelection(singleItem!.value)"
    @keydown.enter="toggleSelection(singleItem!.value)"
    @keydown.space.prevent="toggleSelection(singleItem!.value)"
  >
    <span :class="styles.selectGrouped.radio">
      <span :class="styles.selectGrouped.indicator">
        <Circle v-if="isSelected" :class="styles.selectGrouped.indicatorDot" />
      </span>
    </span>
    <slot
      name="item"
      v-bind="{ item: singleItem, group: props.group, selected: isSelected }"
    >
      <div class="flex w-full items-start gap-4">
        <span class="flex flex-1 flex-col">
          <header
            v-if="singleItem?.label || singleItem?.secondaryLabel"
            class="flex justify-between"
          >
            <span class="flex gap-2">
              <h5 :class="styles.selectGrouped.content.label">
                {{ singleItem?.label }}
              </h5>
              <Badge
                v-if="singleItem?.badge"
                v-bind="singleItem.badge"
                size="sm"
              />
            </span>
            <span class="flex gap-2">
              <Badge
                v-if="singleItem?.secondaryBadge"
                v-bind="singleItem.secondaryBadge"
                size="sm"
              />
              <h5 :class="styles.selectGrouped.content.secondaryLabel">
                {{ singleItem?.secondaryLabel }}
              </h5>
            </span>
          </header>
          <p
            v-if="singleItem?.description"
            :class="styles.selectGrouped.content.description"
          >
            {{ singleItem?.description }}
          </p>
          <p
            v-if="singleItem?.secondaryDescription"
            :class="styles.selectGrouped.content.secondaryDescription"
          >
            {{ singleItem?.secondaryDescription }}
          </p>
        </span>
        <span v-if="singleItem?.action" class="leading-none">
          <Link
            v-show="
              isNil(singleItem.action?.visible) || singleItem.action?.visible
            "
            v-bind="singleItem.action"
            color="muted"
            size="sm"
            @click.stop="doAction(singleItem.action, $event)"
          />
        </span>
      </div>
    </slot>
  </div>

  <!-- Multi-item group: render as collapsible with dropdown -->
  <div v-else class="relative" :class="styles.selectGrouped.group.size">
    <Collapsible v-model:open="isOpen">
      <!-- Collapsible header/trigger -->
      <div
        :class="styles.selectGrouped.group.root"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-haspopup="'listbox'"
        :aria-controls="`dropdown-${groupId}`"
        :aria-disabled="props.disabled"
        :tabindex="props.disabled ? -1 : 0"
        :data-state="hasSelection ? 'checked' : 'unchecked'"
        :data-hover="props.dataHover"
        :data-focus="props.dataFocus"
        @click="toggleOpen"
        @keydown.enter="toggleOpen"
        @keydown.space.prevent="toggleOpen"
        @keydown.escape="isOpen = false"
        @keydown.down="handleArrowDown"
        @keydown.up="handleArrowUp"
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
              <h5 :class="styles.selectGrouped.content.label">
                {{
                  props.group.name || selectedItem?.label || "Select an option"
                }}
              </h5>
              <p
                v-if="selectedItem?.description || props.group.description"
                :class="styles.selectGrouped.content.description"
              >
                {{ selectedItem?.description || props.group.description }}
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
            :uiConfig="props.uiConfig"
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
import { Badge } from "../badge";
import { Link } from "../link";
import { Circle } from "lucide-vue-next";
import SelectGroupedItem from "./SelectGroupedItem.vue";

// --- types
import type {
  SelectGroupedGroupProps,
  SelectGroupedItemProps,
  SelectGroupedItemActionProps
} from "./types";
import { isFunction, isString, isNil, first } from "lodash-es";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    group: SelectGroupedGroupProps;
    modelValue?: string | string[];
    multiple?: boolean;
    required?: boolean;
    disabled?: boolean;
    columns?: number;
    groupClass?: string;
    uiConfig?: { selectGrouped: any };
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

const groupId = useId();
const isOpen = ref(false);

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
  props.uiConfig ?? {}
);

// --- Computed

const isSingleItem = computed(() => props.group.items.length === 1);
const singleItem = computed(() => first(props.group.items));

const selectedItem = computed<SelectGroupedItemProps | undefined>(() => {
  if (Array.isArray(props.modelValue)) {
    return props.group.items.find(item =>
      props.modelValue?.includes(item.value)
    );
  }
  return props.group.items.find(item => item.value === props.modelValue);
});

const hasSelection = computed(() => {
  return props.group.items.some(item => {
    if (Array.isArray(props.modelValue)) {
      return props.modelValue.includes(item.value);
    }
    return item.value === props.modelValue;
  });
});

const isSelected = computed(() => {
  if (!singleItem.value) return false;
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(singleItem.value.value);
  }
  return props.modelValue === singleItem.value.value;
});

// --- Methods

function toggleSelection(value: string) {
  if (props.disabled) return;

  if (props.multiple) {
    const currentValue = Array.isArray(props.modelValue)
      ? [...props.modelValue]
      : [];
    const index = currentValue.indexOf(value);
    if (index > -1) {
      if (!props.required || currentValue.length > 1) {
        currentValue.splice(index, 1);
      }
    } else {
      currentValue.push(value);
    }
    emits("update:modelValue", currentValue);
  } else {
    if (props.modelValue === value && !props.required) {
      emits("update:modelValue", "");
    } else {
      emits("update:modelValue", value);
    }
  }
}

function toggleOpen() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function onItemSelect(value: string) {
  toggleSelection(value);
  if (!props.multiple) {
    isOpen.value = false;
  }
}

function handleArrowDown(event: KeyboardEvent) {
  if (!isOpen.value) {
    isOpen.value = true;
    event.preventDefault();
  }
}

function handleArrowUp(event: KeyboardEvent) {
  if (isOpen.value) {
    event.preventDefault();
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
