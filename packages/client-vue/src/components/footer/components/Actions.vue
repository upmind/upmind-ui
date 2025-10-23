<template>
  <UpmLocale v-if="locale" data-testid="locale-selector" />
  <UpmCurrency v-if="currency" data-testid="currency-selector" />
</template>

<script lang="ts" setup>
// --- external
import { defineProps } from "vue";

// --- components
import UpmCurrency from "../../../modules/basket/components/CurrencySwitcher.vue";
import UpmLocale from "../../../components/LocaleSwitcher.vue";

// --- types
import type { FooterActionsProps } from "../types";

withDefaults(defineProps<FooterActionsProps>(), {
  locale: true,
  currency: true
});
</script>
