<template>
  <div
    class="flex flex-col gap-y-3 rounded-lg border bg-gray-50/50 p-4 px-5 text-sm font-medium leading-[14px]"
  >
    <template v-for="(item, index) in details" :key="'details-' + index">
      <template v-if="item.name">
        <div class="opacity-50">{{ item.category }}:</div>

        <div class="flex justify-between">
          <div>
            <span>{{ item.name }}</span>
            <span v-if="item.quantity && item.quantity > 1">
              (x{{ item.quantity }})</span
            >
          </div>
          <div>
            <span v-if="!item.meta?.overrides">+ </span>
            <span>{{ item.currentPrice }}</span>
          </div>
        </div>

        <div class="h-[1px] border-t last:hidden" />
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- types
import { type BasketProductSummaryDetail } from "@upmind-automation/client-vue";

defineProps<{
  details: BasketProductSummaryDetail[];
}>();
</script>
