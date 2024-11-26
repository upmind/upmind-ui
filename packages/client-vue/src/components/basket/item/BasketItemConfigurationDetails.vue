<template>
  <div
    class="flex flex-col gap-y-3 rounded-lg border bg-gray-50/50 p-4 px-5 text-sm font-medium leading-[14px]"
  >
    <template v-for="(item, index) in details" :key="'details-' + index">
      <template v-if="item.category">
        <DetailsItem :id="id" :item="item" :product="product" />

        <div class="h-[1px] border-t last:hidden" />
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- components
import DetailsItem from "./components/DetailsItem.vue";

// --- types
import type {
  BasketProductSummaryDetail,
  BasketProductDetails,
} from "@upmind-automation/client-vue";

defineProps<{
  id: string;
  details: BasketProductSummaryDetail[];
  product: BasketProductDetails;
}>();
</script>
