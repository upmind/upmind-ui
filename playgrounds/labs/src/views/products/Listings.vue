<template>
  <div class="flex flex-col">
    <div class="mb-4 flex items-center justify-between">
      <label>
        <span>Mode:</span>
        <select v-model="mode">
          <option value="infinite">Infinite</option>
          <option value="paginated">Paginated</option>
        </select>
      </label>

      <label>
        <span>Sort by Name:</span>
        <select v-model="selectedSortDirection">
          <option value="default">Default</option>
          <option value="">Ascending</option>
          <option value="-">Descending</option>
        </select>
      </label>
    </div>
    <div class="flex gap-2">
      <ProductCategories class="w-1/4" v-model="modelValue" />
      <InfiniteProducts
        v-if="mode === 'infinite'"
        class="w-3/4"
        :limit="4"
        :categoryId="modelValue"
        :sort="{
          property: 'name',
          direction: selectedSortDirection
        }"
      />

      <PaginatedProducts
        class="w-3/4"
        v-else-if="mode === 'paginated'"
        :limit="4"
        :categoryId="modelValue"
        :sort="{
          property: 'name',
          direction: selectedSortDirection
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import PaginatedProducts from "./Paginated.vue";
import InfiniteProducts from "./Infinite.vue";
import ProductCategories from "./Categories.vue";
import { RequestSortDirection } from "@upmind-automation/headless";

const mode = ref<"infinite" | "paginated">("paginated");
const modelValue = ref("");
const selectedSortDirection = ref<RequestSortDirection>(
  RequestSortDirection.ASC
);
</script>
