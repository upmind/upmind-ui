<template>
  <Combobox
    v-if="meta.isAvailable || meta.isLoading"
    :modelValue="locale"
    :items="items"
    :loading="meta.isLoading"
    @update:modelValue="updateLocale"
    :search="search"
    width="fit"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useLocale } from "@upmind-automation/headless";

// --- components
import { Combobox } from "@upmind-automation/upmind-ui";

// --- utils
import { map, last, split, filter, includes, get, isEmpty } from "lodash-es";

// --- types
import type { ILanguage } from "../../../types/src";
import type { HTMLAttributes } from "vue";
import type { ComboboxItemProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

// props: {
//   popoverClass: { type: string, default: "mt-0" },
// }

const props = withDefaults(
  defineProps<{
    popoverClass?: HTMLAttributes["class"];
  }>(),
  {
    popoverClass: "mt-0"
  }
);

const { isReady, locale, setLocale, meta, supportedLanguages } = useLocale();

function updateLocale(value: ILanguage["code"]) {
  setLocale(value);
}

function search(
  value: string,
  items?: ComboboxItemProps[]
): ComboboxItemProps[] {
  if (!value || isEmpty(items)) {
    return items || []; // If no search term or no items, return all or empty
  }

  const lowercasedSearchTerm = value.toString().toLowerCase();

  return filter(items, (item: ComboboxItemProps) => {
    // 1. Check the human-readable label (e.g., "Portuguese")
    const label = get(item, "label")?.toString().toLowerCase();
    const matchesLabel = label && includes(label, lowercasedSearchTerm);

    // 2. Check the code (e.g., "pt")
    const itemCode = get(item, "value")?.toString().toLowerCase();
    const matchesCode = itemCode && includes(itemCode, lowercasedSearchTerm);

    // 3. Keep items that match either the label or the code, or are 'persist' items
    return item.persist || matchesLabel || matchesCode;
  });
}

const items = computed(() => {
  return map(supportedLanguages.value, item => {
    return {
      avatar: {
        icon: last(split(item.code, "-"))?.toLowerCase()
      },
      label: item.language,
      selectedLabel: item.language,
      value: item.code,
      selected: item.code === locale.value
    };
  }) as ComboboxItemProps[];
});

await isReady();
</script>
