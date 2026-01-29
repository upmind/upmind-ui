<template>
  <dt v-if="category" class="text-muted text-sm">{{ category }}</dt>
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
import type { DetailsGroupProps } from "./types";

// -----------------------------------------------------------------------------

defineProps<DetailsGroupProps>();
</script>
