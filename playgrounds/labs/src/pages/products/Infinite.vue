<template>
  <UpmLayout>
    <div
      class="mx-auto flex max-w-7xl flex-col items-center gap-y-6"
      :class="props.class"
    >
      <input
        type="search"
        v-model="searchQuery"
        @input="debouncedFilterQuery"
        placeholder="Search products..."
        class="w-full rounded-md border border-gray-300 p-2"
      />

      <Loading :active="meta.isLoading" class-active="w-full">
        <div
          class="grid w-full grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-6"
        >
          <template v-for="product in products ?? []" :key="product.id">
            <Card>
              <template v-if="product?.productDetails">
                <img
                  v-if="product?.productDetails.imgUrl"
                  :src="product.productDetails.imgUrl"
                  :alt="product.productDetails.title"
                  class="mb-4 h-48 w-full object-cover"
                />
                <h3>{{ product.productDetails?.title }}</h3>
                <p>{{ product.productDetails?.description }}</p>
                <p v-if="product.price">
                  Price: {{ product.price.currentPrice }}
                </p>
              </template>
            </Card>
          </template>

          <!-- Skeleton loading when no products or still loading initial page -->
          <template v-if="meta.isLoading">
            <Card v-for="n in skeletonCount" :key="n"></Card>
          </template>
        </div>
      </Loading>

      <template
        v-if="meta.hasNextPage"
        class="flex w-full items-center justify-center"
      >
        <div class="flex items-center justify-between">
          <Button
            class="is-primary px-6 py-3"
            @click="() => nextPage()"
            :disabled="meta.isLoading || !meta.hasNextPage || meta.hasError"
            >Load more</Button
          >
        </div>
      </template>
    </div>
  </UpmLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { UpmLayout } from "@upmind-automation/client-vue";
import {
  type ProductSortableProperties,
  type RequestSortDirection,
  useProductCatalogue
} from "@upmind-automation/headless";
import { Button, Loading, Card } from "@upmind-automation/upmind-ui";
import { debounce } from "lodash-es";
import type {
  IProductCategory,
  ISO_4217_CURRENCY_CODE
} from "@upmind-automation/types";
import type { HtmlHTMLAttributes } from "vue";

const props = withDefaults(
  defineProps<{
    class?: HtmlHTMLAttributes["class"];
    sort: {
      property: ProductSortableProperties;
      direction: RequestSortDirection;
    };
    limit?: number;
    coupons?: string[];
    categoryId?: IProductCategory["id"];
    currencyCode?: ISO_4217_CURRENCY_CODE;
    skeletonCount?: number;
  }>(),
  { skeletonCount: 4, limit: 6 }
);

const searchQuery = ref("");
const search = ref<string>();

// The composable owns the criteria: category, search term and sort go in as
// reactive sources and it writes the model, so this page holds no request state.
const {
  data: products,
  meta,
  nextPage
} = useProductCatalogue({
  categoryId: () => props.categoryId,
  search,
  sortBy: () => props.sort.property,
  direction: () => props.sort.direction,
  pagination: { limit: props.limit },
  infinite: true
});

const debouncedFilterQuery = debounce(() => {
  search.value = searchQuery.value;
}, 500);
</script>
