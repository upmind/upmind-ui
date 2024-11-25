<template>
  <div class="text-xl font-semibold leading-[30px]">
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
