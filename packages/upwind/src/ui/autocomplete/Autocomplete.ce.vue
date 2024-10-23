<template>
  <ComboboxRoot
    v-bind="forwarded"
    v-model="modelValue"
    v-model:open="open"
    :class="variants.autocomplete.root"
    @update:searchTerm="onSearch"
    :filterFunction="v => v"
  >
    <ComboboxAnchor :class="cn(variants.autocomplete.anchor, props.class)">
      <slot name="prepend" />
      <ComboboxInput
        :class="variants.autocomplete.input"
        :placeholder="placeholder"
      />
      <ComboboxTrigger>
        <Icon
          :class="variants.autocomplete.anchorIcon"
          icon="arrow-down"
          :size="props.iconSize"
        />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxContent
      v-bind="forwarded"
      avoidCollisions
      :class="variants.autocomplete.content"
    >
      <ComboboxViewport>
        <ComboboxEmpty :class="variants.autocomplete.empty">
          {{ emptyMessage }}
        </ComboboxEmpty>

        <ComboboxItem
          v-for="item in results"
          v-bind="forwarded"
          :key="(item as Record<string, any>)[props.itemValue]"
          :value="(item as Record<string, any>)[props.itemValue]"
          :class="variants.autocomplete.item"
        >
          <span class="flex items-center gap-2">
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
            <span>{{ item.label }}</span>
          </span>
          <span class="pl-2 text-sm opacity-50">{{ item.tag }}</span>
        </ComboboxItem>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed, watch } from "vue";
import {
  omit,
  find,
  reject,
  filter,
  includes,
  isEqual,
  isString,
  get,
} from "lodash-es";
import { debounce } from "lodash-es";

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

// --- types
import type { AutocompleteProps } from "./types";
import type { ComputedRef } from "vue";
import type { AutocompleteItemProps } from "./types";
import type { ComboboxContentEmits, ComboboxRootEmits } from "radix-vue";

const props = withDefaults(defineProps<AutocompleteProps>(), {
  // --- props
  items: () => [],
  modelValue: "",
  defaultValue: "",
  emptyMessage: "No Results",
  placeholder: "Search...",
  itemLabel: "label",
  itemValue: "value",
  // -- variants
  width: "auto",
  dropdownWidth: "auto",
  align: "end",
  side: "bottom",
  // --- styles
  iconSize: "2xs",
  upwindConfig: () => ({ autocomplete: {} }),
  class: "",
  popoverClass: "",
});

const forwarded = computed(() =>
  omit(props, ["class", "upwindConfig", "popoverClass"])
);

const meta = computed(() => ({
  size: props.size,
  width: props.width,
  dropdownWidth: props.dropdownWidth,
}));

const emits = defineEmits<ComboboxContentEmits & ComboboxRootEmits>();

const open = ref(false);
const processing = ref(false);
const modelValue = ref(
  find(props.items, [props.itemValue, props.modelValue]) || props.modelValue
);
const searchValue = ref();
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

async function safeSearch(value: string | number) {
  processing.value = !!value;

  if (!value) {
    results.value = reject(props.items, "persist");
  } else {
    console.log(props.itemLabel);
    console.log(props.itemValue);
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
}

const onSearch = debounce(safeSearch, 350);

const results = ref(props.items || []);

// --- methods
function doSelect(item: String | AutocompleteItemProps) {
  const selected: AutocompleteItemProps = isString(item)
    ? (find(props.items, [props.itemValue, item]) as AutocompleteItemProps)
    : (item as AutocompleteItemProps);

  const value = get(selected, props.itemValue);
  const oldValue = get(modelValue.value, props.itemValue);
  const hasChanged = !isEqual(value, oldValue);
  if (hasChanged) {
    modelValue.value = selected;
    emits("update:modelValue", value); // NB emit only the value
  }

  // if we have a search value,  set it to the selected value = seamless ui
  if (searchValue.value) {
    searchValue.value = get(selected, props.itemLabel, searchValue.value);
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
// --- side effect

watch(
  () => props,
  newProps => {
    results.value = newProps.items;
    doSelect(newProps.modelValue);
  },
  { deep: true }
);

watch(
  () => modelValue,
  value => {
    emits("update:modelValue", value.value);
  },
  { deep: true }
);
</script>
