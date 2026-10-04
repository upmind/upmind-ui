<template>
  <dt v-if="category" class="text-muted text-sm">{{ category }}</dt>
  <DetailsItem
    v-for="(item, index) in items"
    :key="`details-item-${index}`"
    v-bind="{ ...item, ...detailsItemTestAttrs(item.name) }"
  />
</template>

<script lang="ts" setup>
import { useTestAttrs } from "@upmind/ui";
import DetailsItem from "./DetailsItem.vue";
import type { DetailsGroupProps } from "./types";

// -----------------------------------------------------------------------------

defineProps<DetailsGroupProps>();

const detailsItemTestAttrs = (value?: string) =>
  useTestAttrs({ key: "basket-product-option", value });
</script>
