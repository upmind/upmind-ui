<template>
  <header>
    <PricingList
      v-if="product?.pricing"
      :pricing="product.pricing"
      :meta="product.meta"
      :loading="meta.isLoading"
      :processing="meta.isCalculating"
      :details="product.details"
      :total="total"
      :title="title"
      :options="options"
      :fields="fields"
    />
  </header>
</template>

<script setup lang="ts">
// --- external
import {
  type Product,
  type UseProductConfigMeta
} from "@upmind-automation/headless";

// --- components
import PricingList from "./PricingList.vue";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    product: Product;
    meta: UseProductConfigMeta;
    total?: boolean;
    title?: string;
    options?: boolean;
    fields?: boolean;
  }>(),
  {
    total: true,
    options: true,
    fields: false
  }
);
</script>
