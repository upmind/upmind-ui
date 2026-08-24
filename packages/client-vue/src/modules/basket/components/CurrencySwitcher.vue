<template>
  <Combobox
    v-if="meta.isAvailable && (items.length > 1 || meta.isLoading)"
    :items="items"
    :model-value="model?.code"
    :display-value="displayValue"
    :disabled="meta.isLoading"
    :empty-label="t('text.no_results')"
    class="w-fit"
    open-on-focus
    size-to-options
    reset-search-term-on-blur
    :anchor-data-attrs="{ 'data-test-key': 'currency-selector-trigger' }"
    :data-attrs="{
      'data-test-key': 'currency-selector-value',
      'data-test-value': model?.code ?? ''
    }"
    @update:model-value="updateCurrency"
  >
    <template #prefix>
      <Icon v-if="selectedFlag" :icon="selectedFlag" class="size-4 shrink-0" />
    </template>
    <template #item="{ option }">
      <Icon v-if="option.flag" :icon="option.flag" class="size-4 shrink-0" />
      {{ option.label }}
    </template>
  </Combobox>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBasketCurrency } from "@upmind-automation/headless";
import { Combobox } from "@upmind/ui";
import { Icon } from "../../../components/icon";
import rawCurrencies from "./currencies";
import { get, map } from "lodash-es";
import type { ICurrency } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, model, currencies, update } = useBasketCurrency();

function updateCurrency(value: unknown) {
  update({ code: value as ICurrency["code"] });
}

function flagFor(code?: string) {
  return get(
    rawCurrencies,
    code?.toUpperCase() ?? ""
  )?.country_code?.toLowerCase();
}

const items = computed(() =>
  map(currencies.value, currency => ({
    value: currency.code,
    label: currency.code,
    flag: flagFor(currency.code),
    dataAttrs: {
      "data-test-key": "currency-option",
      "data-test-value": currency.code
    }
  }))
);

const selectedFlag = computed(() => flagFor(model.value?.code));

// The value is the currency code, which is exactly what we display (label ===
// code), so return it directly. Looking it up in `items` failed intermittently:
// `items` loads async, so the lookup could resolve to "" before the currencies
// arrived — leaving the field blank while the flag (static data) still showed.
function displayValue(value: unknown) {
  return String(value ?? "");
}
</script>
