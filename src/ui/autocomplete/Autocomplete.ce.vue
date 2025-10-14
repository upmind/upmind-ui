<template>
  <ComboboxRoot
    :itemLabel="itemLabel"
    :itemValue="itemValue"
    :items="props.items"
    :search="props.search"
    :placeholder="props.placeholder"
    :emptyMessage="props.emptyMessage"
    :size="props.size"
    :width="props.width"
    :popoverWidth="props.popoverWidth"
    :iconSize="props.iconSize"
    :uiConfig="props.uiConfig"
    :popoverClass="props.popoverClass"
    :type="props.type"
    :disabled="props.disabled"
    :autoFocus="props.autoFocus"
    :model-value="modelValue"
    v-model:open="open"
    v-model:searchTerm="searchTerm"
    @update:model-value="doSelect"
    @update:search-term="onSearch"
    :filter-function="noFilter"
    :class="cn(styles.autocomplete.root, props.class)"
    :displayValue="displayValue"
    :resetSearchTermOnBlur="false"
  >
    <ComboboxAnchor :class="cn(styles.autocomplete.anchor, props.class)">
      <slot name="prepend" />
      <ComboboxInput
        :class="styles.autocomplete.input"
        :placeholder="placeholder"
        :auto-focus="props.autoFocus"
      />
      <ComboboxTrigger class="group" v-if="!!results?.length">
        <Icon
          :class="styles.autocomplete.anchorIcon"
          icon="arrow-down"
          :size="props.iconSize"
        />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxContent
      avoidCollisions
      :class="cn(styles.autocomplete.content, props.popoverClass)"
      v-if="!!results?.length"
    >
      <ComboboxViewport>
        <!-- <ComboboxEmpty
          :class="styles.autocomplete.empty"
          v-if="!results?.length"
        >
          {{ emptyMessage }}
        </ComboboxEmpty> -->

        <ComboboxItem
          v-for="item in results"
          :key="get(item, itemValue)"
          :value="get(item, itemValue)"
          :class="styles.autocomplete.item"
        >
          <span class="flex w-full items-center gap-2">
            <ComboboxItemIndicator
              v-if="isSelected(item)"
              :class="styles.autocomplete.indicator"
            >
              <Icon icon="check" size="3xs" />
            </ComboboxItemIndicator>

            <Avatar
              v-if="item.avatar"
              v-bind="item.avatar"
              :size="props.iconSize"
            />

            <Icon
              v-if="isObject(item.icon)"
              :size="props.iconSize"
              :icon="item.icon"
            />

            <span class="flex w-full items-center justify-between">
              <span v-if="get(item, itemLabel)" class="leading-none">
                {{ get(item, itemLabel) }}
              </span>

              <span class="leading-none text-nowrap opacity-50">{{
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
  ComboboxViewport
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
  uniqBy
} from "lodash-es";

// --- types
import type { ComputedRef, Ref } from "vue";
import type { AutocompleteProps, AutocompleteItemProps } from "./types";
import type { ComboboxContentEmits, ComboboxRootEmits } from "radix-vue";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<AutocompleteProps>(), {
  // --- props
  items: () => [],
  emptyMessage: "No Results",
  placeholder: "Search...",
  itemLabel: "label",
  itemValue: "value",
  // -- styles
  width: "md",
  popoverWidth: "md",
  align: "end",
  side: "bottom",
  // --- styles
  iconSize: "xs",
  uiConfig: () => ({ autocomplete: [] })
});

const emits = defineEmits<ComboboxContentEmits & ComboboxRootEmits>();

const meta = computed(() => ({
  size: props.size,
  width: props.width,
  popoverWidth: props.popoverWidth
}));

const open = ref(false);
const processing = ref(false);

const itemValue = computed((): string => props.itemValue || "value");
const itemLabel = computed((): string => props.itemLabel || "label");
const modelValue = computed((): AutocompleteItemProps | undefined =>
  find(props.items, [itemValue.value, props.modelValue])
);

const searchTerm = ref();

// ---

const styles = useStyles(
  ["autocomplete"],
  meta,
  config,
  props.uiConfig ?? {}
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
const results = ref(props.items ?? []) as Ref<AutocompleteItemProps[]>;

function noFilter(items: any, _term: string) {
  return items;
}

async function doSearch(value: string) {
  if (processing.value) return;

  processing.value = !!value;

  if (!value) {
    results.value = reject(props.items, "persist");
  } else if (isFunction(props.search)) {
    results.value = await props.search(value.toString());
  } else {
    // --- if no search function is provided, just filter the items
    results.value = filter(props.items ?? [], (item: AutocompleteItemProps) => {
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

  return results.value;
}

// --- methods

function doSelect(item: AutocompleteItemProps | string) {
  if (!item) {
    // modelValue.value = undefined;
    emits("update:modelValue", {});
    return;
  }

  // if we use a search function it will always return a string when one of the results is selected
  // so we know it's a string and we can emit it directly
  if (isString(item)) {
    emits("update:modelValue", item);
    return;
  }

  const value = get(item, itemValue.value);
  const oldValue = get(modelValue.value, itemValue.value);
  const hasChanged = !isEqual(value, oldValue);

  if (hasChanged) {
    emits("update:modelValue", value); // NB emit only the value
  }
  // finnaly close the popover
  open.value = false;
}

function isSelected(item: AutocompleteItemProps) {
  return (
    modelValue.value &&
    (modelValue.value as Record<string, any>)?.[itemValue.value] ===
      (item as Record<string, any>)?.[itemValue.value]
  );
}

function displayValue(value: AutocompleteItemProps) {
  let label;
  const selected = find(results.value, [itemValue.value, value]);

  if (isFunction(props.displayValue)) {
    label = props.displayValue(selected || value);
  } else {
    label = get(selected, itemLabel.value, searchTerm.value || value);
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
      itemValue
    ) as AutocompleteItemProps[];
    // results.value.push(...newProps.items);

    if (newProps.modelValue) {
      const selected = find(results.value, [
        itemValue,
        newProps.modelValue
      ]) as AutocompleteItemProps;

      if (selected) doSelect(selected);
    }
  },
  { deep: true }
);
</script>
