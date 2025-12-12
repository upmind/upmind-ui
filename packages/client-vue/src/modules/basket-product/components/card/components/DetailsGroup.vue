<template>
  <DetailsItem
    v-for="(item, index) in items"
    :data-testid="`basket-product-details-item-${index}`"
    :key="`details-item-${index}`"
    v-bind="item"
  />
</template>

<script lang="ts" setup>
// --- components
import DetailsItem from "./DetailsItem.vue";

// --- types
import type { Product } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

defineProps<{
  id: string;
  category?: string;
  items: Product["details"];
}>();
</script>
