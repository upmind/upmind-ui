<template>
  <div class="text-[18px] font-semibold leading-[30px] md:text-[22px]">
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
