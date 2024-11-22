<template>
  <span
    v-if="pricing.meta?.discounted"
    class="text-sm italic leading-5 line-through opacity-50"
    >{{ pricing.regularPrice }}</span
  >
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
