<template>
  <Combobox
    v-if="meta.isAvailable && (items?.length > 1 || meta.isLoading)"
    :modelValue="model?.code"
    :items="items"
    :loading="meta.isLoading"
    @update:modelValue="updateCurrency"
    search
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useBasketCurrency } from "@upmind-automation/headless";
import rawCurrencies from "./currencies";

interface Currency {
  code: string;
  name: string;
  country: string;
  country_code: string;
}

const typedRawCurrencies: Record<string, Currency> = rawCurrencies;

// --- components
import { Combobox } from "@upmind-automation/upmind-ui";

// --- utils
import { get, map } from "lodash-es";

// --- types
import type { HTMLAttributes } from "vue";
import type { ComboboxItemProps } from "@upmind-automation/upmind-ui";
import type { ICurrency } from "../../../../../types/src";
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
      label: currency.code,
      selectedLabel: currency.code,
      value: currency.code,
      selected: currency.code === model.value?.code
    };
  }) as ComboboxItemProps[];
});
</script>
