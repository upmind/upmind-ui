<template>
  <!-- own Card (default) vs flat inside a parent card (card=false), mirroring
       the loaded BasketProduct — a card here too nests one card in another -->
  <component
    :is="props.card ? Card : 'div'"
    :class="productRootContainerVariants({ card: props.card })"
    :ui="meta.cardUi"
  >
    <div :class="productRootSummariesVariants({ card: props.card })">
      <article :class="productSummaryArticleVariants()">
        <!-- Header: Image, Category/ExPrice, Name/CurrentPrice -->
        <header :class="productSummaryHeaderRootVariants()">
          <!-- Product Image -->
          <Skeleton :class="productSkeletonImageVariants()" />

          <div :class="productSkeletonStackVariants()">
            <!-- Top row: Category + Ex price -->
            <div :class="productSummaryHeaderTopVariants()">
              <div :class="productSummaryCategoryRootVariants()">
                <Skeleton :class="productSkeletonCategoryVariants()" />
              </div>
            </div>

            <!-- Title row: Name + Current price -->
            <div :class="productSkeletonTitleRowVariants()">
              <div :class="productSummaryTitleGroupVariants()">
                <Skeleton :class="productSkeletonTitleTextVariants()" />
              </div>
              <Skeleton :class="productSkeletonPriceVariants()" />
            </div>
          </div>
        </header>

        <!-- Footer: Controls (quantity + term) + Renew description -->
        <footer :class="productSummaryFooterRootVariants()">
          <div :class="productSkeletonControlsVariants()">
            <div :class="productSummaryFooterTermsControlsVariants()">
              <Skeleton :class="productSkeletonQuantityVariants()" />
            </div>
            <Skeleton :class="productSkeletonRenewVariants()" />
          </div>
        </footer>
      </article>
    </div>

    <!-- the inline-config placeholder leans on the card's inset, as the loaded
         config form does -->
    <div :class="productRootConfigVariants({ card: props.card })">
      <slot />
    </div>
  </component>
</template>

<script lang="ts" setup>
import { Card, Skeleton } from "@upmind/ui";
import { computed } from "vue";
import {
  productRootCardContentVariants,
  productRootContainerVariants,
  productRootSummariesVariants,
  productRootConfigVariants,
  productSummaryArticleVariants,
  productSummaryHeaderRootVariants,
  productSummaryHeaderTopVariants,
  productSummaryCategoryRootVariants,
  productSummaryTitleGroupVariants,
  productSummaryFooterRootVariants,
  productSummaryFooterTermsControlsVariants,
  productSkeletonImageVariants,
  productSkeletonStackVariants,
  productSkeletonCategoryVariants,
  productSkeletonTitleRowVariants,
  productSkeletonTitleTextVariants,
  productSkeletonPriceVariants,
  productSkeletonControlsVariants,
  productSkeletonQuantityVariants,
  productSkeletonRenewVariants
} from "./basketProduct.variants";
import type { BasketProductSkeletonProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BasketProductSkeletonProps>(), {
  card: true
});

const meta = computed(() => {
  // Undefined so the non-card <div> branch gets no ui attribute.
  let cardUi;
  if (props.card) cardUi = { content: productRootCardContentVariants() };

  return { cardUi };
});
</script>
