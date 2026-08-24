<template>
  <CardRoot as="li" :class="productRootCardVariants()">
    <div :class="productRootSummariesVariants()">
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

    <slot />
  </CardRoot>
</template>

<script lang="ts" setup>
import { CardRoot } from "@upmind/ui";
import { Skeleton } from "@upmind/ui";
import {
  productRootCardVariants,
  productRootSummariesVariants,
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
</script>
