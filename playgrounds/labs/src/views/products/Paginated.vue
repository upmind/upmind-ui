<template>
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

    <Loading :active="meta.isLoading" class="w-full">
      <div
        class="grid w-full grid-cols-[repeat(auto-fill,_minmax(18rem,_1fr))] gap-6"
      >
        <template
          v-for="product in products ?? Array(skeletonCount)"
          :key="product?.id ?? product"
        >
          <UpmCard>
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
          </UpmCard>
        </template>
      </div>
    </Loading>

    <div class="flex w-full items-center justify-between">
      <Button
        class="is-primary px-6 py-3"
        @click="prevPage"
        :disabled="!meta.hasPrevPage || meta.hasError"
        :is-processing="meta.isLoading"
        >Previous</Button
      >

      <div class="text-center">
        <p class="text-sm">
          Showing
          {{
            pagination.from === pagination.to
              ? `${pagination.from}`
              : `${pagination.from}-${pagination.to}`
          }}
          of {{ pagination.total.toString() }} items
        </p>
        <p class="text-xs text-gray-400">
          Page {{ pagination.page.toString() }} of
          {{ pagination.pages.toString() }}
        </p>
      </div>

      <Button
        class="is-primary px-6 py-3"
        @click="nextPage"
        :disabled="!meta.hasNextPage || meta.hasError"
        :is-processing="meta.isLoading"
        >Next</Button
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { HtmlHTMLAttributes, ref, watch } from "vue";
import { debounce } from "lodash-es";
import {
  RequestSortDirection,
  useProductCatalogue,
} from "@upmind-automation/headless";
import {
  IProductCategory,
  type ISO_4217_CURRENCY_CODE,
} from "@upmind-automation/types";
import { UpmCard } from "@upmind-automation/client-vue";
import { Button, Loading } from "@upmind-automation/upmind-ui";

const props = withDefaults(
  defineProps<{
    class?: HtmlHTMLAttributes["class"];
    sort: {
      property: string;
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

const {
  data: products,
  meta,
  sort,
  filters,
  nextPage,
  prevPage,
  pagination,
} = useProductCatalogue({
  sort: [props.sort.direction, props.sort.property],
  pagination: {
    limit: props.limit,
  },
});

const searchQuery = ref("");

const debouncedFilterQuery = debounce(() => {
  filters.query(searchQuery.value);
}, 500);

watch(
  () => props.categoryId,
  categoryId => {
    filters.productCategory(categoryId);
  },
  { immediate: true }
);

watch(
  () => props.sort,
  (newSort: {
    property: string;
    direction: RequestSortDirection | "default";
  }) => {
    if (newSort.direction === "default") sort.clear();
    else sort.set(newSort.property, newSort.direction);
  },
  { immediate: true }
);
</script>
