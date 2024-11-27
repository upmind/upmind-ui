<template>
  <div
    class="flex flex-col divide-y divide-solid rounded-lg border bg-gray-50/50 p-4 px-5 text-sm font-medium leading-[14px]"
  >
    <template v-for="(item, index) in details" :key="'details-' + index">
      <template v-if="item.category">
        <DetailsItem
          :id="id"
          :category="item.category"
          :name="item.name"
          :quantity="item.quantity"
          :current-price="item.currentPrice"
          :current-amount="item.currentAmount"
          :overrides="item.meta?.overrides"
          :invalid="item.meta?.invalid"
          :cycle="item.cycle"
          :pricing-key="item.key"
          :free="item.meta?.free"
        />
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- components
import DetailsItem from "./components/DetailsItem.vue";

// --- types
import type { BasketProductSummaryDetail } from "@upmind-automation/client-vue";

defineProps<{
  id: string;
  details: BasketProductSummaryDetail[];
}>();
</script>
