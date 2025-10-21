<template>
  <UpmLocale data-testid="locale-selector" />
  <UpmCurrency data-testid="currency-selector" />
</template>

<script lang="ts" setup>
// --- components
import UpmCurrency from "../../modules/basket/components/CurrencySwitcher.vue";
import UpmLocale from "../../components/LocaleSwitcher.vue";
</script>
