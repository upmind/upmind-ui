<template>
  <div class="flex items-end justify-between gap-2">
    <PoweredByUpmind />
    <UpmCurrency data-testid="currency-selector" />
  </div>
</template>

<script lang="ts" setup>
// --- components
import UpmCurrency from "../../modules/basket/components/CurrencySwitcher.vue";
import PoweredByUpmind from "./PoweredByUpmind.vue";
</script>
