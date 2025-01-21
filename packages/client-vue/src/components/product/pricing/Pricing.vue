<template>
  <ExPrice v-bind="props" />
  <CurrentPrice v-bind="props" />
</template>

<script setup lang="ts">
import ExPrice from "./ExPrice.vue";
import CurrentPrice from "./CurrentPrice.vue";

const props = defineProps<{
  regularPrice?: number | string;
  currentPrice?: number | string;
  meta?: {
    discounted?: boolean;
    free?: boolean;
  };
  cycle?: number | string;
}>();
</script>
