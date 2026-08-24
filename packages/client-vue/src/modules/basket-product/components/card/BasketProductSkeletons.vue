<template>
  <!-- one placeholder per product already in the basket, so the list keeps its
       height while the cards load; at least one before any product is known -->
  <div :class="productRootItemsVariants({ card: props.card })" v-auto-animate>
    <template
      v-for="index in Math.max(1, products?.length ?? 0)"
      :key="`skeleton-cart-item-${index}`"
    >
      <BasketProductSkeleton :card="props.card">
        <slot />
      </BasketProductSkeleton>
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
// --- internal
import { useBasketProducts } from "@upmind-automation/headless";
import { productRootItemsVariants } from "./basketProduct.variants";
// --- components
import BasketProductSkeleton from "./BasketProductSkeleton.vue";
// --- types
import type { BasketProductSkeletonsProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BasketProductSkeletonsProps>(), {
  card: true
});

const { products } = useBasketProducts();
</script>
