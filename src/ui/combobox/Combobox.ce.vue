<template>
  <Popover
    v-model:open="open"
    :disabled="props.disabled"
    :class="styles.combobox.root"
  >
    <PopoverTrigger as-child :ring="false">
      <Button
        :loading="props.loading"
        :class="cn('group', styles.combobox.trigger, props.class)"
        :size="props.size"
        :aria-expanded="open"
        variant="control"
        icon-append="arrow-down"
        :checked="open"
        :data-hover="$attrs['data-hover']"
        :data-focus="$attrs['data-focus']"
        ring
      >
        <template #prepend v-if="!isEmpty(modelValue) || searchValue">
          <slot name="selected" v-bind="{ item: modelValue }">
            <Avatar
              v-if="meta.hasAvatar"
              v-bind="avatar"
              size="xs"
              shape="circle"
              fit="cover"
              aria-hidden="true"
            />
            <Icon
              v-if="meta.hasIcon"
              :icon="icon"
              shape="circle"
              size="3xs"
              fit="cover"
              aria-hidden="true"
            />
          </slot>
        </template>

        <template #default v-if="!isEmpty(modelValue)">
          <span :class="styles.combobox.label">{{ label }}</span>
        </template>

        <template #default>
          <span class="opacity-50">
            <slot name="placeholder">{{ props.placeholder || "&nbsp;" }}</slot>
          </span>
        </template>

        <template #append>
          <Icon
            class="opacity-75 transition-all duration-200 [&>svg]:p-0.5"
            icon="arrow-down"
            :class="cn(open ? 'rotate-180' : '')"
            size="nano"
          />
        </template>
      </Button>
    </PopoverTrigger>

    <PopoverContent
      :align="align"
      :side="side"
      avoidCollisions
      :class="cn(styles.combobox.content, props.popoverClass)"
    >
      <Command
        :modelValue="modelValue"
        :filterFunction="items => items"
        v-model:searchTerm="searchValue"
      >
        <template v-if="props.search">
          <CommandInput
            :placeholder="searchPlaceholder"
            :class="styles.combobox.input"
          />
        </template>
        <CommandList
          class="border-control-default w-full max-w-full border-t p-2"
          loop
        >
          <CommandEmpty class="text-muted">{{ emptyMessage }}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="item in filteredItems"
              :key="(item as Record<string, any>)[itemValue]"
              :value="(item as Record<string, any>)[itemValue]"
              @select="doSelect(get(item, itemValue))"
              class="group flex cursor-pointer items-center justify-start gap-4"
              :class="styles.combobox.item"
              :data-selected="isSelected(item) ? 'true' : 'false'"
            >
              <Avatar v-if="item.avatar" v-bind="item.avatar" size="xs" />

              <Icon v-if="item.icon" :icon="item.icon" size="xs" />

              <span
                class="flex w-full items-center justify-between"
                :data-testid="`combobox-item`"
              >
                <span
                  v-if="(item as Record<string, any>)?.[itemLabel]"
                  :class="styles.combobox.label"
                >
                  {{ get(item, itemLabel) }}
                </span>

                <span
                  v-if="item.tag"
                  class="leading-none text-nowrap opacity-50"
                  >{{ item.tag }}</span
                >
              </span>

              <Icon
                v-if="props.checkedIcon"
                icon="check"
                size="2xs"
                :class="
                  cn('ml-auto', isSelected(item) ? 'opacity-100' : 'opacity-0')
                "
              />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed, watch } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./combobox.config";

// --- components
import Icon from "../icon/Icon.ce.vue";
import Button from "../button/Button.ce.vue";
import Avatar from "../avatar/Avatar.ce.vue";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput
} from "../command";

// --- utils
import { find, get, isEmpty, isEqual, isFunction, has } from "lodash-es";

// --- types
import type { ComboboxProps, ComboboxItemProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<ComboboxProps>(), {
  // --- props
  label: "",
  items: () => [],
  modelValue: "",
  loading: false,
  search: false,
  emptyMessage: "No Results",
  placeholder: "",
  itemLabel: "label",
  itemValue: "value",
  checkedIcon: true,
  // -- styles
  color: "base",
  size: "md",
  width: "auto",
  variant: "control",
  align: "end",
  side: "bottom",
  // ---
  icon: "",
  iconSize: "xs",

  // --- styles
  uiConfig: () => ({ combobox: [] }),
  class: "",
  popoverClass: ""
});

const emits = defineEmits(["update:modelValue"]);

const meta = computed(() => ({
  size: props.size,
  width: props.width,
  hasRing: props.ring,
  truncate: props.truncate,
  hasAvatar: props.avatar || has(modelValue.value, "avatar"),
  hasIcon: props.icon || has(modelValue.value, "icon")
}));

const open = ref(false);

const itemValue = computed((): string => props.itemValue || "value");
const itemLabel = computed((): string => props.itemLabel || "label");

const modelValue = computed(() =>
  find(props.items, [itemValue.value, props.modelValue])
);

const avatar = computed(() => modelValue.value?.avatar || props.avatar);
const icon = computed(() => modelValue.value?.icon || props.icon);
const label = computed(() => {
  const selectedLabel = get(modelValue.value, "selectedLabel");
  return selectedLabel || get(modelValue.value, itemLabel.value);
});
// ---

const styles = useStyles(
  ["combobox"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  combobox: {
    root: string;
    trigger: string;
    content: string;
    item: string;
    input: string;
    label: string;
  };
}>;

const searchValue = ref("");

const filteredItems = computed(() => {
  if (!props.search || !searchValue.value) {
    return props.items ?? [];
  }

  if (isFunction(props.search)) {
    return props.search(searchValue.value, props.items);
  }

  return (props.items ?? []).filter((item: ComboboxItemProps) => {
    const value = get(item, itemValue.value)?.toString().toLowerCase();
    const label = get(item, itemLabel.value)?.toString().toLowerCase();
    const search = searchValue.value.toLowerCase();
    return (
      item.persist ||
      (value && value.includes(search)) ||
      (label && label.includes(search))
    );
  });
});

// --- methods
function doSelect(item: string) {
  const selected: ComboboxItemProps = find(props.items, [
    itemValue.value,
    item
  ]) as ComboboxItemProps;

  const newValue = get(selected, itemValue.value);
  const oldValue = get(modelValue.value, itemValue.value);
  const hasChanged = !isEqual(newValue, oldValue);
  if (hasChanged) {
    emits("update:modelValue", newValue); // NB emit only the value
  }

  // finally close the popover
  open.value = false;
}

function isSelected(item: ComboboxItemProps) {
  const selectedValue = get(modelValue.value, itemValue.value);
  const value = get(item, itemValue.value);
  return isEqual(selectedValue, value);
}
// --- side effect

watch(
  () => props.modelValue,
  newValue => {
    if (newValue) doSelect(newValue);
  }
);
</script>
