<template>
  <div>
    <Combobox
      v-if="meta.isAvailable"
      :modelValue="locale"
      :items="items"
      @update:modelValue="updateLocale"
      :search="search"
      width="auto"
      dropdown-width="md"
      icon="translate-01"
      size="md"
      :value-data-attrs="{
        'data-test-key': 'language-selector-value',
        'data-test-value': locale ?? ''
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useLocale } from "@upmind-automation/headless";
import { Combobox } from "@upmind-automation/upmind-ui";
import { map, last, split, includes, get, isEmpty } from "lodash-es";
import type { ILanguage } from "@upmind-automation/types";
import type { ComboboxItemProps } from "@upmind-automation/upmind-ui";
import type { HTMLAttributes } from "vue";
// -----------------------------------------------------------------------------

// props: {
//   popoverClass: { type: string, default: "mt-0" },
// }

const _props = withDefaults(
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
    return items || [];
  }

  const lowercasedSearchTerm = value.toString().toLowerCase();

  return (items || []).filter((item: ComboboxItemProps) => {
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
