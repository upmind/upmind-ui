<template>
  <div
    class="flex flex-col divide-y divide-solid rounded-lg border bg-gray-50/50 p-4 px-5 text-sm font-medium leading-[14px]"
  >
    <template v-for="(item, index) in details" :key="'details-' + index">
      <DetailsItem
        :id="id"
        v-bind="item"
        :free="item.meta?.free"
        :invalid="item.meta?.invalid"
        :overrides="item.meta?.overrides"
      />
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
