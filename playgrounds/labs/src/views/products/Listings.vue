<template>
  <div class="flex gap-2">
    <ProductCategories class="w-1/3" v-model="modelValue" />
    <PaginatedProducts
      :limit="6"
      class="w-2/3"
      :categoryId="modelValue"
      :skeletonCount="6"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import PaginatedProducts from "./Paginated.vue";
import ProductCategories from "./Categories.vue";

const modelValue = ref("");
</script>
