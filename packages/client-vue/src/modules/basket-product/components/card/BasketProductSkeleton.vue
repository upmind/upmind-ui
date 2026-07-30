<template>
  <!-- own Card (default) vs flat inside a parent card (card=false) -->
  <component :is="props.card ? Card : 'div'" :class="styles.product.container">
    <div :class="styles.product.summaries">
      <article :class="styles.product.summary.article">
        <!-- Header: Image, Category/ExPrice, Name/CurrentPrice -->
        <header :class="styles.product.summary.header.root">
          <!-- Product Image -->
          <Skeleton :class="styles.product.skeleton.image" />

          <div :class="styles.product.skeleton.stack">
            <!-- Top row: Category + Ex price -->
            <div :class="styles.product.summary.header.top">
              <div :class="styles.product.summary.category.root">
                <Skeleton :class="styles.product.skeleton.category" />
              </div>
            </div>

            <!-- Title row: Name + Current price -->
            <div :class="styles.product.skeleton.title.row">
              <div :class="styles.product.summary.title.group">
                <Skeleton :class="styles.product.skeleton.title.text" />
              </div>
              <Skeleton :class="styles.product.skeleton.price" />
            </div>
          </div>
        </header>

        <!-- Footer: Controls (quantity + term) + Renew description -->
        <footer :class="styles.product.summary.footer.root">
          <div :class="styles.product.skeleton.controls">
            <div :class="styles.product.summary.footer.terms.controls">
              <Skeleton :class="styles.product.skeleton.quantity" />
            </div>
            <Skeleton :class="styles.product.skeleton.renew" />
          </div>
        </footer>
      </article>
    </div>

    <div :class="styles.product.config">
      <slot />
    </div>
  </component>
</template>

<script lang="ts" setup>
import { Card, Skeleton, useStyles } from "@upmind-automation/upmind-ui";
import config from "./basketProduct.config";

// --- types
import type { BasketProductSkeletonProps } from "./types";

const props = withDefaults(defineProps<BasketProductSkeletonProps>(), {
  card: true
});

const styles = useStyles(
  [
    "product.container",
    "product.summaries",
    "product.config",
    "product.summary",
    "product.summary.header",
    "product.summary.category",
    "product.summary.title",
    "product.summary.footer",
    "product.summary.footer.terms",
    "product.skeleton",
    "product.skeleton.title"
  ],
  // flat (card=false) drops the summary's own inset — the parent card owns it
  { card: props.card },
  config
);
</script>
