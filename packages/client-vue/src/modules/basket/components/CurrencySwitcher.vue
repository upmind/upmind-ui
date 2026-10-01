<template>
  <CurrencySelect
    v-if="meta.isAvailable && (size(currencies) > 1 || meta.isLoading)"
    :model-value="model?.code"
    :currencies="currencies"
    :disabled="meta.isLoading"
    @update:model-value="updateCurrency"
  />
</template>

<script lang="ts" setup>
import { useBasketCurrency } from "@upmind-automation/headless";
import CurrencySelect from "./CurrencySelect.vue";
import { size } from "lodash-es";
import type { ICurrency } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const { meta, model, currencies, update } = useBasketCurrency();

function updateCurrency(value: ICurrency["code"]) {
  update({ code: value });
}
</script>
