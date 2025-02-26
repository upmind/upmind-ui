<template>
  <ExPrice v-bind="props" />
  <CurrentPrice v-bind="props" />
</template>

<script setup lang="ts">
// --- components
import ExPrice from "./ExPrice.vue";
import CurrentPrice from "./CurrentPrice.vue";

// --- types
import { type PricingProps } from "./types";

const props = defineProps<PricingProps>();

defineOptions({
  inheritAttrs: false,
});
</script>
