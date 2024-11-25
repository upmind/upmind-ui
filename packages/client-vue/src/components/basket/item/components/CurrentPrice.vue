<template>
  <div class="text-lg font-semibold leading-[30px] md:text-xl">
    {{ pricing.currentPrice }}
  </div>
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
