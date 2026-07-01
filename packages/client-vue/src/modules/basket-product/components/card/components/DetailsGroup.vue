<template>
  <dt v-if="category" class="text-muted text-sm">{{ category }}</dt>
  <DetailsItem
    v-for="(item, index) in items"
    :key="`details-item-${index}`"
    v-bind="item"
    data-testid="basket-product-option"
    :data-test-value="item.name"
  />
</template>

<script lang="ts" setup>
import DetailsItem from "./DetailsItem.vue";
import type { DetailsGroupProps } from "./types";

// -----------------------------------------------------------------------------

defineProps<DetailsGroupProps>();
</script>
