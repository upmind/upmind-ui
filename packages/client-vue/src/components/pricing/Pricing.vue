<template>
  <ExPrice v-bind="props" :upwind-config="upwindConfig" />
  <CurrentPrice v-bind="props" :upwind-config="upwindConfig" />
</template>

<script setup lang="ts">
// --- components
import ExPrice from "./ExPrice.vue";
import CurrentPrice from "./CurrentPrice.vue";

// --- types
import { type PricingProps } from "./types";

const props = defineProps<PricingProps>();
</script>
