<template>
  <Combobox
    :items="items"
    :model-value="props.modelValue"
    :display-value="displayValue"
    :disabled="props.disabled"
    :empty-label="t('text.no_results')"
    class="w-fit"
    open-on-focus
    size-to-options
    reset-search-term-on-blur
    :anchor-data-attrs="{ 'data-test-key': 'currency-selector-trigger' }"
    :data-attrs="{
      'data-test-key': 'currency-selector-value',
      'data-test-value': props.modelValue ?? ''
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
import { Combobox } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/foundation";
import rawCurrencies from "./currencies";
import { get, map } from "lodash-es";
import type { CurrencySelectProps } from "./types";
import type { ICurrency } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<CurrencySelectProps>(), {
  currencies: () => [],
  disabled: false
});

const emit = defineEmits<{
  "update:modelValue": [code: ICurrency["code"]];
}>();

const { t } = useI18n();

function updateCurrency(value: unknown) {
  emit("update:modelValue", value as ICurrency["code"]);
}

function flagFor(code?: string) {
  return get(
    rawCurrencies,
    code?.toUpperCase() ?? ""
  )?.country_code?.toLowerCase();
}

const items = computed(() =>
  map(props.currencies, currency => ({
    value: currency.code,
    label: currency.code,
    flag: flagFor(currency.code),
    dataAttrs: {
      "data-test-key": "currency-option",
      "data-test-value": currency.code
    }
  }))
);

const selectedFlag = computed(() => flagFor(props.modelValue));

// The value is the currency code, which is exactly what we display (label ===
// code), so return it directly. Looking it up in `items` failed intermittently:
// `items` loads async, so the lookup could resolve to "" before the currencies
// arrived — leaving the field blank while the flag (static data) still showed.
function displayValue(value: unknown) {
  return String(value ?? "");
}
</script>
