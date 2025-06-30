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
        <template v-if="products && products.pages">
          <template
            v-for="(page, pageIndex) in products.pages"
            :key="`page-${pageIndex}`"
          >
            <template
              v-for="product in page.pageData"
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
          </template>
        </template>
        <!-- Skeleton loading when no products or still loading initial page -->
        <template v-else-if="meta.isLoading">
          <UpmCard v-for="n in skeletonCount" :key="n"></UpmCard>
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
          @click="nextPage"
          :disabled="meta.isLoading || !meta.hasNextPage || meta.hasError"
          >Load more</Button
        >
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from "vue";
import { debounce } from "lodash-es";
import { useProductCatalogue } from "@upmind-automation/headless";
import {
  IProductCategory,
  type ISO_4217_CURRENCY_CODE
} from "@upmind-automation/types";
import { HtmlHTMLAttributes } from "vue";
import { UpmCard } from "@upmind-automation/client-vue";
import { Button, Loading } from "@upmind-automation/upmind-ui";

const props = withDefaults(
  defineProps<{
    class?: HtmlHTMLAttributes["class"];
    coupons?: string[];
    categoryId?: IProductCategory["id"];
    currencyCode?: ISO_4217_CURRENCY_CODE;
    skeletonCount?: number;
    limit?: number;
  }>(),
  { skeletonCount: 4, limit: 6 }
);

const {
  data: products,
  meta,
  filters,
  nextPage
} = useProductCatalogue({ pagination: { limit: props.limit }, infinite: true });

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
</script>
