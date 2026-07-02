<template>
  <div>
    <Combobox
      v-if="meta.isAvailable && (items?.length > 1 || meta.isLoading)"
      :modelValue="model?.code"
      :items="items"
      :loading="meta.isLoading"
      @update:modelValue="updateCurrency"
      search
      width="fit"
      size="md"
      :trigger-data-attrs="{ 'data-test-key': 'currency-selector-trigger' }"
      :value-data-attrs="{
        'data-test-key': 'currency-selector-value',
        'data-test-value': model?.code ?? ''
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useBasketCurrency } from "@upmind-automation/headless";
import { Combobox } from "@upmind-automation/upmind-ui";
import rawCurrencies from "./currencies";
import { get, map } from "lodash-es";
import type { ICurrency } from "../../../../../types/src";
import type { ComboboxItemProps } from "@upmind-automation/upmind-ui";
import type { HTMLAttributes } from "vue";

interface Currency {
  code: string;
  name: string;
  country: string;
  country_code: string;
}

const _typedRawCurrencies: Record<string, Currency> = rawCurrencies;
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

const { meta, model, currencies, update } = useBasketCurrency();

function updateCurrency(value: ICurrency["code"]) {
  update({ code: value });
}

const items = computed(() => {
  return map(currencies.value, currency => {
    return {
      avatar: {
        icon: get(
          rawCurrencies,
          currency.code?.toUpperCase()
        )?.country_code?.toLowerCase()
      },
      dataAttrs: { "data-test-key": `currency-option-${currency.code}` },
      label: currency.code,
      selectedLabel: currency.code,
      value: currency.code,
      selected: currency.code === model.value?.code
    };
  }) as ComboboxItemProps[];
});
</script>
