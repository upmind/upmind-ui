<template>
  <ExPrice
    :regular-price="props.regularPrice"
    :monthly-from-regular-price="props.monthlyFromRegularPrice"
    :discounted="props.discounted"
    :use-monthly-from-price="props.useMonthlyFromPrice"
  />
  <CurrentPrice
    :current-price="props.currentPrice"
    :monthly-from-current-price="props.monthlyFromCurrentPrice"
    :free="props.free"
    :use-monthly-from-price="props.useMonthlyFromPrice"
  />
</template>

<script setup lang="ts">
// --- components
import ExPrice from "./ExPrice.vue";
import CurrentPrice from "./CurrentPrice.vue";

// --- types
import { type PricingProps } from "./types";

// -----------------------------------------------------------------------------

defineOptions({ inheritAttrs: false });

const props = defineProps<PricingProps>();
</script>
