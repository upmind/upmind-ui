<template>
  <ExPrice
    v-bind="
      pick(props, ['regularPrice', 'monthlyFromRegularPrice', 'discounted'])
    "
  />
  <CurrentPrice
    v-bind="pick(props, ['currentPrice', 'monthlyFromCurrentPrice', 'free'])"
  />
</template>

<script setup lang="ts">
// --- components
import ExPrice from "./ExPrice.vue";
import CurrentPrice from "./CurrentPrice.vue";

// --- internal
import { pick } from "lodash-es";

// --- types
import { type PricingProps } from "./types";

const props = defineProps<PricingProps>();

defineOptions({
  inheritAttrs: false
});
</script>
