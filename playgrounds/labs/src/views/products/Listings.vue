<template>
  <div class="flex gap-2">
    <ProductCategories class="w-1/3" v-model="modelValue" />
    <InfiniteProducts
      v-if="!modelValue"
      class="w-2/3"
      :skeletonCount="4"
      :limit="4"
      :categoryId="modelValue"
    />

    <!-- <PaginatedProducts
      :limit="4"
      class="w-2/3"
      :categoryId="modelValue"
      :skeletonCount="4"
    /> -->
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import PaginatedProducts from "./Paginated.vue";
import InfiniteProducts from "./Infinite.vue";
import ProductCategories from "./Categories.vue";

const modelValue = ref("");
</script>
