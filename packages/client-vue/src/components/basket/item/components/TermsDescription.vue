<template>
  <span class="text-sm italic leading-5 opacity-50">{{
    t(`product.terms.${pricing.cycle}`, [pricing.currentPrice])
  }}</span>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- types
import { type BasketProductSummaryPrice } from "@upmind-automation/client-vue";

const { t } = useI18n();

defineProps<{
  pricing: BasketProductSummaryPrice;
}>();
</script>
