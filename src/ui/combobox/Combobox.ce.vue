<template>
  <Popover
    v-model:open="open"
    :disabled="props.disabled"
    :class="styles.combobox.root"
  >
    <PopoverTrigger as-child>
      <Button
        :loading="props.loading"
        :class="cn('group w-full', styles.combobox.trigger, props.class)"
        :size="props.size"
        :aria-expanded="open"
        :color="props.color"
        :variant="props.variant"
      >
        <template v-if="!isEmpty(modelValue) || searchTerm">
          <slot name="selected" v-bind="{ item: modelValue }">
            <Avatar
              v-if="modelValue?.avatar || props.avatar"
              v-bind="modelValue?.avatar || props?.avatar"
              size="3xs"
              shape="circle"
              fit="cover"
              aria-hidden="true"
            />
            <Icon
              v-if="modelValue?.icon || props.icon"
              :icon="modelValue?.icon || props?.icon"
              shape="circle"
              size="3xs"
              fit="cover"
              aria-hidden="true"
            />

            {{
              modelValue?.selectedLabel ||
              modelValue?.[props.itemLabel] ||
              searchTerm
            }}
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
          <CommandInput v-model="searchTerm" :placeholder="placeholder" />
          <CommandEmpty>{{ emptyMessage }}</CommandEmpty>
        </template>
        <CommandList class="w-full max-w-full" loop>
          <CommandGroup>
            <CommandItem
              v-for="item in results"
              :key="(item as Record<string, any>)[props.itemValue]"
              :value="(item as Record<string, any>)[props.itemValue]"
              @select="doSelect(item)"
              class="group flex cursor-pointer items-center justify-start gap-4"
              :class="styles.combobox.item"
            >
              <Avatar
                v-if="item.avatar"
                v-bind="item.avatar"
                :size="props.iconSize"
              />

              <Icon v-if="item.icon" :icon="item.icon" :size="props.iconSize" />

              <span class="flex w-full items-center justify-between">
                <span
                  v-if="(item as Record<string, any>)?.[props.itemLabel]"
                  class="leading-none"
                >
                  {{ get(item, props.itemLabel) }}
                </span>

                <span
                  v-if="item.tag"
                  class="text-nowrap leading-none opacity-50"
                  >{{ item.tag }}</span
                >
              </span>

              <Icon
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
import { Input } from "../input";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from "../command";

// --- utils
import {
  debounce,
  filter,
  find,
  get,
  includes,
  isEmpty,
  isEqual,
  isFunction,
  isString,
  reject,
} from "lodash-es";

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
  placeholder: "Search...",
  itemLabel: "label",
  itemValue: "value",
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
  uiConfig: () => ({ combobox: {} }),
  class: "",
  popoverClass: "",
});

const emits = defineEmits(["update:modelValue"]);

const meta = computed(() => ({
  color: props.color,
  size: props.size,
  width: props.width,
}));

const open = ref(false);
const processing = ref(false);
const modelValue = ref(
  find(props.items, [props.itemValue, props.modelValue]) || props.modelValue
);
const searchTerm = ref();

// ---

const styles = useStyles(
  ["combobox"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  combobox: { root: string; trigger: string; content: string; item: string };
}>;

async function safeSearch(value: string | number) {
  processing.value = !!value;

  if (!value) {
    results.value = reject(props.items, "persist");
  } else if (isFunction(props.search)) {
    results.value = await props.search(value.toString());
  } else {
    // --- if no search function is provided, just filter the items
    results.value = filter(
      props.items,
      (item: ComboboxItemProps) =>
        item.persist ||
        includes(
          (item as Record<string, any>)?.[props.itemLabel]?.toLowerCase(),
          value.toString().toLowerCase()
        ) ||
        includes(
          (item as Record<string, any>)?.[props.itemValue]?.toLowerCase(),
          value.toString().toLowerCase()
        )
    );
  }

  const presistedItems = filter(props.items, "persist");

  if (presistedItems.length > 0) {
    // if (results.value.length) results.value.push({ as: "separator" });
    results.value.push(...presistedItems);
  }

  processing.value = false;
}

const onSearch = debounce(safeSearch, 350);

const results = ref(props.items || []);

// --- methods
function doSelect(item: String | ComboboxItemProps) {
  const selected: ComboboxItemProps = isString(item)
    ? (find(props.items, [props.itemValue, item]) as ComboboxItemProps)
    : (item as ComboboxItemProps);

  const value = get(selected, props.itemValue);
  const oldValue = get(modelValue.value, props.itemValue);
  const hasChanged = !isEqual(value, oldValue);
  if (hasChanged) {
    modelValue.value = selected;
    emits("update:modelValue", value); // NB emit only the value
  }

  // if we have a search value,  set it to the selected value = seamless ui
  if (searchTerm.value) {
    searchTerm.value = get(selected, props.itemLabel, searchTerm.value);
  }

  // finnaly close the popover
  open.value = false;
}

function isSelected(item: ComboboxItemProps) {
  return (
    modelValue.value &&
    (modelValue.value as Record<string, any>)?.[props.itemValue] ===
      (item as Record<string, any>)?.[props.itemValue]
  );
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
