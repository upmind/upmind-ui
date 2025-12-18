<template>
  <header :class="styles.summary.header">
    <PricingList
      v-if="product?.pricing"
      :pricing="product.pricing"
      :meta="product.meta"
      :loading="meta.isLoading"
      :processing="meta.isCalculating"
      :details="product.details"
      :total="total"
    />
  </header>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import {
  type Product,
  type UseProductConfigMeta
} from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./pricing.config";

// --- components
import PricingList from "./PricingList.vue";

// --- types
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    product: Product;
    meta: UseProductConfigMeta;
    total?: boolean;
  }>(),
  {
    total: true
  }
);

const styles = useStyles(["summary"], {}, config) as ComputedRef<{
  summary: {
    footer: string;
    header?: string;
  };
}>;
</script>
