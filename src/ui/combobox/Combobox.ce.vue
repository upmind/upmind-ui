<template>
  <Popover
    v-model:open="open"
    :disabled="props.disabled"
    :class="styles.combobox.root"
  >
    <PopoverTrigger as-child>
      <Button
        v-bind="$attrs"
        :loading="props.loading"
        :class="cn('group', styles.combobox.trigger, props.class)"
        :size="props.size"
        :aria-expanded="open"
        :color="props.color"
        :variant="props.variant"
        data-testid="popover-trigger"
      >
        <template v-if="!isEmpty(modelValue) || searchTerm">
          <slot name="selected" v-bind="{ item: modelValue }">
            <Avatar
              v-if="meta.hasAvatar"
              v-bind="avatar"
              size="3xs"
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

            <span class="truncate">{{ label }}</span>
          </slot>
        </template>

        <span v-else-if="search" class="opacity-50">
          <slot name="placeholder">{{ props.placeholder }}</slot>
        </span>

        <template #append>
          <Icon
            class="-mr-1.5 ml-auto opacity-75 transition-all duration-200"
            icon="arrow-up-down"
            size="xs"
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
      <Command>
        <template v-if="props.search">
          <InputExtended
            v-if="isFunction(props.search)"
            v-model="searchTerm"
            @update:modelValue="onSearch"
            :placeholder="placeholder"
            input-size="sm"
            :class="styles.combobox.input"
          >
            <template #prepend>
              <Icon icon="search" size="2xs" class="mr-1 opacity-50" />
            </template>
          </InputExtended>
          <CommandInput
            v-else
            v-model="searchTerm"
            :placeholder="placeholder"
          />
          <CommandEmpty>{{ emptyMessage }}</CommandEmpty>
        </template>
        <CommandList class="w-full max-w-full" loop>
          <CommandGroup>
            <CommandItem
              v-for="item in results"
              :key="(item as Record<string, any>)[itemValue]"
              :value="(item as Record<string, any>)[itemValue]"
              @select="doSelect(get(item, itemValue))"
              class="group flex cursor-pointer items-center justify-start gap-4"
              :class="styles.combobox.item"
            >
              <Avatar
                v-if="item.avatar"
                v-bind="item.avatar"
                :size="props.iconSize"
              />

              <Icon v-if="item.icon" :icon="item.icon" :size="props.iconSize" />

              <span
                class="flex w-full items-center justify-between"
                :data-testid="`combobox-item`"
              >
                <span
                  v-if="(item as Record<string, any>)?.[itemLabel]"
                  class="leading-none"
                >
                  {{ get(item, itemLabel) }}
                </span>

                <span
                  v-if="item.tag"
                  class="text-nowrap leading-none opacity-50"
                  >{{ item.tag }}</span
                >
              </span>

              <Icon
                v-if="props.checkedIcon"
                icon="check"
                :size="props.iconSize"
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
import { InputExtended } from "../input-extended";
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
import {
  debounce,
  filter,
  find,
  get,
  includes,
  isObject,
  isEmpty,
  isEqual,
  isFunction,
  isString,
  reject,
  has
} from "lodash-es";

// --- types
import type { ComboboxProps, ComboboxItemProps } from "./types";
import type { ComputedRef, Ref } from "vue";

const props = withDefaults(defineProps<ComboboxProps>(), {
  // --- props
  label: "",
  items: () => [],
  modelValue: "",
  loading: false,
  search: false,
  emptyMessage: "No Results",
  placeholder: "Search...",
  itemLabel: "label",
  itemValue: "value",
  checkedIcon: true,
  // -- styles
  color: "base",
  size: "md",
  width: "xl",
  variant: "control",
  align: "end",
  side: "bottom",
  // ---
  icon: "",
  iconSize: "2xs",

  // --- styles
  uiConfig: () => ({ combobox: [] }),
  class: "",
  popoverClass: ""
});

const emits = defineEmits(["update:modelValue"]);

const meta = computed(() => ({
  color: props.color,
  size: props.size,
  width: props.width,
  hasAvatar: props.avatar || has(modelValue.value, "avatar"),
  hasIcon: props.icon || has(modelValue.value, "icon")
}));

const open = ref(false);
const processing = ref(false);

const itemValue = computed((): string => props.itemValue || "value");
const itemLabel = computed((): string => props.itemLabel || "label");

const modelValue = computed(() =>
  find(props.items, [itemValue.value, props.modelValue])
);

const searchTerm = ref();
const avatar = computed(() => modelValue.value?.avatar || props.avatar);
const icon = computed(() => () => modelValue.value?.icon || props.icon);
const label = computed(() => {
  const selectedLabel = get(modelValue.value, "selectedLabel");
  return (
    selectedLabel || get(modelValue.value, itemLabel.value) || searchTerm.value
  );
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
  };
}>;

async function safeSearch(value: string | number) {
  processing.value = !!value;

  if (!value) {
    results.value = reject(props.items, "persist");
  } else if (isFunction(props.search)) {
    results.value = await props.search(value.toString());
  } else {
    // --- if no search function is provided, just filter the items
    results.value = filter(props.items ?? [], (item: ComboboxItemProps) => {
      const v = get(item, itemValue.value)?.toString().toLowerCase();
      const l = get(item, itemLabel.value)?.toString().toLowerCase();
      return (
        item.persist ||
        includes(v, value.toString().toLowerCase()) ||
        includes(l, value.toString().toLowerCase())
      );
    });
  }

  const presistedItems = filter(props.items, "persist");

  if (presistedItems.length > 0) {
    // if (results.value.length) results.value.push({ as: "separator" });
    results.value.push(...presistedItems);
  }

  processing.value = false;
}

const onSearch = debounce(safeSearch, 350);

const results = ref(props.items ?? []) as Ref<ComboboxItemProps[]>;

// --- methods
function doSelect(item: string) {
  const selected: ComboboxItemProps = find(props.items, [
    itemValue.value,
    item
  ]) as ComboboxItemProps;

  const value = get(selected, itemValue.value);
  const oldValue = get(modelValue.value, itemValue.value);
  const hasChanged = !isEqual(value, oldValue);
  if (hasChanged) {
    emits("update:modelValue", value); // NB emit only the value
  }

  // if we have a search value,  set it to the selected value = seamless ui
  if (searchTerm.value) {
    searchTerm.value = get(selected, itemLabel.value, searchTerm.value);
  }

  // finnaly close the popover
  open.value = false;
}

function isSelected(item: ComboboxItemProps) {
  const selectedValue = get(modelValue.value, itemValue.value);
  const value = get(item, itemValue.value);
  return isEqual(selectedValue, value);
}
// --- side effect

watch(
  () => props,
  newProps => {
    results.value = newProps.items;
    doSelect(newProps.modelValue);
  },
  { deep: true }
);
</script>
