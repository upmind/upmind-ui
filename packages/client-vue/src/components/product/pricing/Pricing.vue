<template>
  <ExPrice v-bind="props" :class="exClass" />
  <CurrentPrice v-bind="props" :class="currentClass" />
</template>

<script setup lang="ts">
import ExPrice from "./ExPrice.vue";
import CurrentPrice from "./CurrentPrice.vue";

const props = defineProps<{
  regularPrice?: number | string;
  currentPrice?: number | string;
  monthlyFromCurrentPrice?: number | string;
  monthlyFromRegularPrice?: number | string;
  meta?: {
    discounted?: boolean;
    free?: boolean;
  };
  cycle?: number | string;
  // ---
  showCycle?: boolean;
  currentClass?: string;
  exClass?: string;
}>();
</script>
