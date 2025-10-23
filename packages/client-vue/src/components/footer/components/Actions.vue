<template>
  <UpmLocale data-testid="locale-selector" />
  <UpmCurrency data-testid="currency-selector" />
</template>

<script lang="ts" setup>
// --- external
import { defineProps } from "vue";

// --- components
import UpmCurrency from "../../../modules/basket/components/CurrencySwitcher.vue";
import UpmLocale from "../../../components/LocaleSwitcher.vue";

// --- types
import type { FooterActionsProps } from "../types";
</script>
