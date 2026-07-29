<template>
  <!-- breakdown: per-product blocks with config lines (mirrors the details
       summary). Shapes are a guess — the basket contents aren't known until
       the fetch lands; varied widths and line counts read as real content,
       not a repeated pattern. -->
  <div v-if="props.showBreakdown" :class="styles.summary.sections">
    <div :class="styles.summary.products">
      <!-- product with two config lines: priced header + boxed lines -->
      <div :class="styles.summary.product.root">
        <div :class="styles.summary.product.header">
          <Skeleton :class="styles.summary.bars.w40" />
          <Skeleton :class="styles.summary.bars.w16" />
        </div>
        <div :class="styles.summary.product.box">
          <div :class="styles.summary.line.root">
            <Skeleton :class="styles.summary.bars.w36" />
            <Skeleton :class="styles.summary.bars.w16" />
          </div>
          <div :class="styles.summary.line.root">
            <Skeleton :class="styles.summary.bars.w28" />
            <Skeleton :class="styles.summary.bars.w12" />
          </div>
        </div>
      </div>

      <!-- product with one config line -->
      <div :class="styles.summary.product.root">
        <div :class="styles.summary.product.header">
          <Skeleton :class="styles.summary.bars.w28" />
          <Skeleton :class="styles.summary.bars.w16" />
        </div>
        <div :class="styles.summary.product.box">
          <div :class="styles.summary.line.root">
            <Skeleton :class="styles.summary.bars.w44" />
            <Skeleton :class="styles.summary.bars.w16" />
          </div>
        </div>
      </div>
    </div>

    <!-- adjustments: the taxes line -->
    <div :class="styles.summary.adjustments">
      <div :class="styles.summary.line.root">
        <Skeleton :class="styles.summary.bars.w14" />
        <Skeleton :class="styles.summary.bars.w32" />
      </div>
    </div>

    <!-- total: term is xl-loose (36px box) -->
    <div :class="cn(styles.summary.item.root, styles.summary.total)">
      <Skeleton :class="styles.summary.bars.total" />
      <Skeleton :class="styles.summary.item.skeleton" />
    </div>

    <!-- stand-in for the checkout button the basket aside hides while loading -->
    <Skeleton v-if="props.showButton" :class="styles.summary.bars.button" />
  </div>

  <div v-else :class="styles.summary.root">
    <!-- product rows: name / price -->
    <div v-if="props.showProducts" :class="styles.summary.bars.group">
      <div :class="styles.summary.bars.row">
        <Skeleton :class="styles.summary.bars.w40" />
        <Skeleton :class="styles.summary.bars.w16" />
      </div>
      <div :class="styles.summary.bars.row">
        <Skeleton :class="styles.summary.bars.w28" />
        <Skeleton :class="styles.summary.bars.w16" />
      </div>
    </div>

    <!-- subtotal/tax rows + total (mirrors the subtotals DescriptionList) -->
    <div :class="styles.summary.bars.group">
      <div :class="styles.summary.bars.row">
        <Skeleton :class="styles.summary.bars.w20" />
        <Skeleton :class="styles.summary.bars.w16" />
      </div>
      <div :class="styles.summary.bars.row">
        <Skeleton :class="styles.summary.bars.w28" />
        <Skeleton :class="styles.summary.bars.w16" />
      </div>

      <!-- total: term is xl-loose (36px box) -->
      <div :class="styles.summary.bars.totalRow">
        <Skeleton :class="styles.summary.bars.total" />
        <Skeleton :class="styles.summary.item.skeleton" />
      </div>
    </div>

    <!-- stand-in for the checkout button the basket aside hides while loading -->
    <Skeleton v-if="props.showButton" :class="styles.summary.bars.button" />
  </div>
</template>

<script setup lang="ts">
import { Skeleton, cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./summary.config";

// --- types
import type { SummarySkeletonProps } from "./types";

const props = withDefaults(defineProps<SummarySkeletonProps>(), {
  showBreakdown: false,
  showProducts: false,
  showButton: true,
  card: false
});

const styles = useStyles(
  [
    "summary",
    "summary.item",
    "summary.line",
    "summary.product",
    "summary.bars"
  ],
  props,
  config
);
</script>
