<template>
  <div class="flex flex-col">
    <label>
      <span>Mode:</span>
      <select class="mb-4" v-model="mode">
        <option value="infinite">Infinite</option>
        <option value="paginated">Paginated</option>
      </select>
    </label>
    <div class="flex gap-2">
      <ProductCategories class="w-1/4" v-model="modelValue" />
      <InfiniteProducts
        v-if="mode === 'infinite'"
        class="w-3/4"
        :limit="4"
        :categoryId="modelValue"
      />

      <PaginatedProducts
        class="w-3/4"
        v-else-if="mode === 'paginated'"
        :limit="4"
        :categoryId="modelValue"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import PaginatedProducts from "./Paginated.vue";
import InfiniteProducts from "./Infinite.vue";
import ProductCategories from "./Categories.vue";

const mode = ref<"infinite" | "paginated">("paginated");
const modelValue = ref("");
</script>
