<template>
  <!-- breakdown: per-product blocks with config lines (mirrors the details
       summary). Shapes are a guess — the basket contents aren't known until
       the fetch lands; varied widths and line counts read as real content,
       not a repeated pattern. -->
  <div v-if="props.showBreakdown" :class="summarySectionsVariants()">
    <div :class="summaryProductsVariants()">
      <!-- product with two config lines: priced header + boxed lines -->
      <div :class="summaryProductRootVariants()">
        <div :class="summaryProductHeaderVariants()">
          <Skeleton :class="summaryBarsWidthVariants({ width: 'w40' })" />
          <Skeleton :class="summaryBarsWidthVariants({ width: 'w16' })" />
        </div>
        <div :class="summaryProductBoxVariants({ card: props.card })">
          <div :class="summaryLineRootVariants()">
            <Skeleton :class="summaryBarsWidthVariants({ width: 'w36' })" />
            <Skeleton :class="summaryBarsWidthVariants({ width: 'w16' })" />
          </div>
          <div :class="summaryLineRootVariants()">
            <Skeleton :class="summaryBarsWidthVariants({ width: 'w28' })" />
            <Skeleton :class="summaryBarsWidthVariants({ width: 'w12' })" />
          </div>
        </div>
      </div>

      <!-- product with one config line -->
      <div :class="summaryProductRootVariants()">
        <div :class="summaryProductHeaderVariants()">
          <Skeleton :class="summaryBarsWidthVariants({ width: 'w28' })" />
          <Skeleton :class="summaryBarsWidthVariants({ width: 'w16' })" />
        </div>
        <div :class="summaryProductBoxVariants({ card: props.card })">
          <div :class="summaryLineRootVariants()">
            <Skeleton :class="summaryBarsWidthVariants({ width: 'w44' })" />
            <Skeleton :class="summaryBarsWidthVariants({ width: 'w16' })" />
          </div>
        </div>
      </div>
    </div>

    <!-- adjustments: the taxes line -->
    <div :class="summaryAdjustmentsVariants()">
      <div :class="summaryLineRootVariants()">
        <Skeleton :class="summaryBarsWidthVariants({ width: 'w14' })" />
        <Skeleton :class="summaryBarsWidthVariants({ width: 'w32' })" />
      </div>
    </div>

    <!-- total: term is text-xl (28px box) -->
    <div :class="cn(summaryItemRootVariants(), summaryTotalVariants())">
      <Skeleton :class="summaryBarsTotalVariants()" />
      <Skeleton :class="summaryItemSkeletonVariants()" />
    </div>

    <!-- stand-in for the checkout button the basket aside hides while loading -->
    <Skeleton v-if="props.showButton" :class="summaryBarsButtonVariants()" />
  </div>

  <div v-else :class="summaryRootVariants()">
    <!-- product rows: name / price -->
    <div v-if="props.showProducts" :class="summaryBarsGroupVariants()">
      <div :class="summaryBarsRowVariants()">
        <Skeleton :class="summaryBarsWidthVariants({ width: 'w40' })" />
        <Skeleton :class="summaryBarsWidthVariants({ width: 'w16' })" />
      </div>
      <div :class="summaryBarsRowVariants()">
        <Skeleton :class="summaryBarsWidthVariants({ width: 'w28' })" />
        <Skeleton :class="summaryBarsWidthVariants({ width: 'w16' })" />
      </div>
    </div>

    <!-- subtotal/tax rows + total (mirrors the subtotals DescriptionList) -->
    <div :class="summaryBarsGroupVariants()">
      <div :class="summaryBarsRowVariants()">
        <Skeleton :class="summaryBarsWidthVariants({ width: 'w20' })" />
        <Skeleton :class="summaryBarsWidthVariants({ width: 'w16' })" />
      </div>
      <div :class="summaryBarsRowVariants()">
        <Skeleton :class="summaryBarsWidthVariants({ width: 'w28' })" />
        <Skeleton :class="summaryBarsWidthVariants({ width: 'w16' })" />
      </div>

      <!-- total: term is text-xl (28px box) -->
      <div :class="summaryBarsTotalRowVariants()">
        <Skeleton :class="summaryBarsTotalVariants()" />
        <Skeleton :class="summaryItemSkeletonVariants()" />
      </div>
    </div>

    <!-- stand-in for the checkout button the basket aside hides while loading -->
    <Skeleton v-if="props.showButton" :class="summaryBarsButtonVariants()" />
  </div>
</template>

<script setup lang="ts">
import { Skeleton } from "@upmind/ui";
import { cn } from "@upmind/ui";
import {
  summaryAdjustmentsVariants,
  summaryBarsButtonVariants,
  summaryBarsGroupVariants,
  summaryBarsRowVariants,
  summaryBarsTotalRowVariants,
  summaryBarsTotalVariants,
  summaryBarsWidthVariants,
  summaryItemRootVariants,
  summaryItemSkeletonVariants,
  summaryLineRootVariants,
  summaryProductBoxVariants,
  summaryProductHeaderVariants,
  summaryProductRootVariants,
  summaryProductsVariants,
  summaryRootVariants,
  summarySectionsVariants,
  summaryTotalVariants
} from "./summary.variants";
// --- types
import type { SummarySkeletonProps } from "./types";

const props = withDefaults(defineProps<SummarySkeletonProps>(), {
  showBreakdown: false,
  showProducts: false,
  showButton: true,
  card: false
});
</script>
