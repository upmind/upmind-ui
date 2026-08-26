<template>
  <Combobox
    v-if="meta.isAvailable"
    :items="items"
    :model-value="locale"
    :display-value="displayValue"
    :empty-label="t('text.no_results')"
    class="w-fit"
    open-on-focus
    size-to-options
    reset-search-term-on-blur
    :anchor-data-attrs="{ 'data-test-key': 'language-selector-trigger' }"
    :data-attrs="{
      'data-test-key': 'language-selector-value',
      'data-test-value': locale ?? ''
    }"
    @update:model-value="updateLocale"
  >
    <template #prefix>
      <Icon icon="translate-01" class="text-muted size-4 shrink-0" />
    </template>
    <template #item="{ option }">
      <Icon v-if="option.flag" :icon="option.flag" class="size-4 shrink-0" />
      {{ option.label }}
    </template>
  </Combobox>
</template>

<script lang="ts" setup>
import { Combobox } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useLocale } from "@upmind-automation/headless";
import { Icon } from "./icon";
import { map, last, split } from "lodash-es";
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { isReady, locale, setLocale, meta, supportedLanguages } = useLocale();

function updateLocale(value: unknown) {
  setLocale(value as string);
}

const items = computed(() =>
  map(supportedLanguages.value, item => ({
    value: item.code,
    label: item.language,
    flag: last(split(item.code, "-"))?.toLowerCase(),
    dataAttrs: { "data-test-key": `language-option-${item.code}` }
  }))
);

// Field shows the selected language name; reka filters the list as you type.
function displayValue(value: unknown) {
  return items.value.find(item => item.value === value)?.label ?? "";
}

await isReady();
</script>
