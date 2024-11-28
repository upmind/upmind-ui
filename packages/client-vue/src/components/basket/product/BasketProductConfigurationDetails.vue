<template>
  <div
    class="flex flex-col divide-y divide-solid rounded-lg border bg-gray-50/50 p-4 px-5 text-sm font-medium leading-[14px]"
  >
    <DetailsGroup
      v-for="(group, index) in groupedDetails"
      :key="'details-group-' + index"
      :id="id"
      :category="first(group)?.category"
      :items="group"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { groupBy, first } from "lodash-es";
import { computed } from "vue";

// --- components
import DetailsGroup from "./components/DetailsGroup.vue";

// --- types
import type { BasketProductSummaryDetail } from "@upmind-automation/client-vue";

const props = defineProps<{
  id: string;
  details: BasketProductSummaryDetail[];
}>();

const groupedDetails = computed(() => {
  return groupBy(props.details, "category");
});
</script>
