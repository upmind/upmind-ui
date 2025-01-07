<template>
  <ComboboxRoot
    v-bind="delegatedProps"
    :model-value="modelValue"
    v-model:open="open"
    v-model:searchTerm="searchTerm"
    @update:model-value="doSelect"
    @update:search-term="onSearch"
    :filter-function="noFilter"
    :class="variants.autocomplete.root"
    :displayValue="displayValue"
    :resetSearchTermOnBlur="false"
  >
    <ComboboxAnchor :class="cn(variants.autocomplete.anchor, props.class)">
      <slot name="prepend" />
      <ComboboxInput
        :class="variants.autocomplete.input"
        :placeholder="placeholder"
        :auto-focus="props.autoFocus"
      />
      <ComboboxTrigger class="group" v-if="!!results?.length">
        <Icon
          :class="variants.autocomplete.anchorIcon"
          icon="arrow-down"
          :size="props.iconSize"
        />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxContent
      avoidCollisions
      :class="cn(variants.autocomplete.content, props.popoverClass)"
      v-if="!!results?.length"
    >
      <ComboboxViewport>
        <!-- <ComboboxEmpty
          :class="variants.autocomplete.empty"
          v-if="!results?.length"
        >
          {{ emptyMessage }}
        </ComboboxEmpty> -->

        <ComboboxItem
          v-for="item in results"
          :key="(item as Record<string, any>)[props.itemValue]"
          :value="(item as Record<string, any>)[props.itemValue]"
          :class="variants.autocomplete.item"
        >
          <span class="flex w-full items-center gap-2">
            <ComboboxItemIndicator
              v-if="isSelected(item)"
              :class="variants.autocomplete.indicator"
            >
              <Icon icon="check" size="3xs" />
            </ComboboxItemIndicator>

            <Avatar
              v-if="item.avatar"
              v-bind="item.avatar"
              :size="props.iconSize"
            />

            <Icon v-if="item.icon" v-bind="item.icon" :size="props.iconSize" />

            <span class="flex w-full items-center justify-between">
              <span
                v-if="(item as Record<string, any>)?.[props.itemLabel]"
                class="leading-none"
              >
                {{ get(item, props.itemLabel) }}
              </span>

              <span class="text-nowrap leading-none opacity-50">{{
                item.tag
              }}</span>
            </span>
          </span>
        </ComboboxItem>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed, watch } from "vue";

// --- internal
import { useStyles } from "../../utils";
import config from "./autocomplete.config";
import { cn } from "../../utils";

// --- components
import Icon from "../icon/Icon.ce.vue";
import Avatar from "../avatar/Avatar.ce.vue";
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from "radix-vue";

// --- utils
import {
  debounce,
  filter,
  find,
  get,
  includes,
  isEqual,
  isFunction,
  isString,
  reject,
  omit,
  isObject,
  uniqBy,
} from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { AutocompleteProps, AutocompleteItemProps } from "./types";
import type { ComboboxContentEmits, ComboboxRootEmits } from "radix-vue";

const props = withDefaults(defineProps<AutocompleteProps>(), {
  // --- props
  items: () => [],
  emptyMessage: "No Results",
  placeholder: "Search...",
  itemLabel: "label",
  itemValue: "value",
  // -- variants
  width: "md",
  popoverWidth: "md",
  align: "end",
  side: "bottom",
  // --- styles
  iconSize: "2xs",
  upwindConfig: () => ({ autocomplete: {} }),
});

const emits = defineEmits<ComboboxContentEmits & ComboboxRootEmits>();

const delegatedProps = computed(() =>
  omit(props, [
    "itemLabel",
    "itemValue",
    "items",
    "search",
    "placeholder",
    "emptyMessage",
    "size",
    // "color",
    // "variant",
    "width",
    "popoverWidth",
    "iconSize",
    "upwindConfig",
    "class",
    "popoverClass",
    "type",
    "disabled",
    "autoFocus",
  ])
);

const meta = computed(() => ({
  size: props.size,
  width: props.width,
  popoverWidth: props.popoverWidth,
}));

const open = ref(false);
const processing = ref(false);
const modelValue = ref<AutocompleteItemProps | undefined>(
  find(props.items, [props.itemValue, props.modelValue])
);
const searchTerm = ref();

// ---

const variants = useStyles(
  ["autocomplete"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  autocomplete: {
    root: string;
    input: string;
    anchor: string;
    anchorIcon: string;
    empty: string;
    content: string;
    item: string;
    indicator: string;
  };
}>;

// -----------------------------------------------------------------------------
const onSearch = debounce(doSearch, 350);
const results = ref(props.items || []);

function noFilter(items: any, _term: string) {
  return items;
}

async function doSearch(value: string) {
  if (processing.value) return;

  processing.value = !!value;

  if (!value) {
    results.value = reject(props.items, "persist");
  } else if (isFunction(props.search)) {
    results.value = await props.search(value);
  } else {
    // --- if no search function is provided, just filter the items
    results.value = filter(
      props.items,
      (item: AutocompleteItemProps) =>
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

  return results.value;
}

// --- methods

function doSelect(item: String | AutocompleteItemProps) {
  const selected: AutocompleteItemProps | undefined = isString(item)
    ? (find(results.value, [props.itemValue, item]) as AutocompleteItemProps)
    : (item as AutocompleteItemProps);

  if (!selected) {
    modelValue.value = undefined;
    return;
  }

  const value = get(selected, props.itemValue);
  const oldValue = get(modelValue.value, props.itemValue);
  const hasChanged = !isEqual(value, oldValue);

  if (hasChanged) {
    modelValue.value = selected;
    emits("update:modelValue", value); // NB emit only the value
  }
  // finnaly close the popover
  open.value = false;
}

function isSelected(item: AutocompleteItemProps) {
  return (
    modelValue.value &&
    (modelValue.value as Record<string, any>)?.[props.itemValue] ===
      (item as Record<string, any>)?.[props.itemValue]
  );
}

function displayValue(value: AutocompleteItemProps) {
  let label;
  const selected = isObject(value)
    ? value
    : find(results.value, [props.itemValue, value]);

  if (isFunction(props.displayValue)) {
    label = props.displayValue(selected || value);
  } else {
    label = get(selected, props.itemLabel, searchTerm.value || value);
  }
  return label;
}
// --- side effect

watch(
  () => props,
  newProps => {
    // we always keep the results unique so we can have valid modalValues on dynamic searches
    results.value = uniqBy(
      [...results.value, ...newProps.items],
      props.itemValue
    );
    // results.value.push(...newProps.items);
    doSelect(newProps.modelValue?.toString());
  },
  { deep: true }
);
</script>
