<template>
  <div
    class="-mb-[16px] flex flex-col gap-y-3 rounded-lg border bg-gray-50/50 p-4 px-5 text-sm font-medium leading-[14px]"
  >
    <template
      v-for="(item, index) in filteredDetails"
      :key="'details-' + index"
    >
      <div class="opacity-50">{{ item.category }}:</div>

      <div class="flex justify-between">
        <div>
          <span>{{ item.name }}</span>
          <span v-if="item.quantity && item.quantity > 1">
            (x{{ item.quantity }})</span
          >
        </div>
        <div>{{ item.regularPrice }}</div>
      </div>

      <!-- TODO: Seperator component looks strange at 1px due to the implementation -->
      <div class="h-[1px] border-t last:hidden" />
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- types
import { type BasketProductSummaryDetail } from "@upmind-automation/client-vue";

const props = defineProps<{
  details: BasketProductSummaryDetail[];
}>();

const filteredDetails = computed(() => {
  return props.details.filter(item => item.key !== "term");
});
</script>
