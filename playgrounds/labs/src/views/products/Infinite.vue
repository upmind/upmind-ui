<template>
  <div
    class="mx-auto flex max-w-7xl flex-col items-center gap-y-6"
    :class="props.class"
  >
    <pre>
      {{ JSON.stringify(meta, null, 2) }}
    </pre>
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
import { watch } from "vue";
import { useInfiniteProductCatalogue } from "@upmind-automation/headless";
import {
  IProductCategory,
  type ISO_4217_CURRENCY_CODE,
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
  nextPage,
} = useInfiniteProductCatalogue({ pagination: { limit: props.limit } });

watch(
  () => props.categoryId,
  categoryId => {
    filters.productCategory(categoryId);
  },
  { immediate: true }
);
</script>
