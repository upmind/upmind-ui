<template>
  <div :class="styles.product.root">
    <div :class="styles.product.content">
      <Skeleton v-if="!stylesMeta.hideImage" class="rounded-lg">
        <Image
          :ratio="stylesMeta.imageRatio as ImageProps['ratio']"
          :class="styles.product.image.root"
        />
      </Skeleton>

      <section :class="styles.product.details">
        <header :class="styles.product.header.root">
          <section :class="styles.product.header.info.root">
            <div :class="styles.product.header.info.container">
              <div class="flex flex-col gap-1">
                <Skeleton :class="`h-8 ${randomWidth('w-3/4')}`" />

                <Skeleton :class="`h-6 ${randomWidth('w-1/2')}`" />
              </div>
            </div>

            <div v-if="!stylesMeta.hideDescription" class="flex flex-col gap-1">
              <Skeleton class="h-6 w-full" />
              <Skeleton class="h-6 w-full" />
              <Skeleton :class="`h-6 ${randomWidth('w-44')}`" />
            </div>
          </section>

          <section
            v-if="!stylesMeta.hidePrice"
            :class="styles.product.header.price.root"
            class="gap-2"
          >
            <p :class="styles.product.header.price.currentPrice.root">
              <Skeleton :class="`h-9 ${randomWidth('w-28')}`" />
              <Skeleton :class="`ml-1 h-6 ${randomWidth('w-24')}`" />
            </p>

            <Skeleton :class="`h-6 ${randomWidth('w-2/3')}`" />
          </section>

          <Skeleton v-if="!stylesMeta.hideTerms" class="h-11 w-full" />
        </header>

        <footer :class="styles.product.footer">
          <Skeleton class="button-radius h-11 w-full" />
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- components
import { Skeleton, Image, useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import { useConfig } from "@upmind-automation/headless";
import config from "./card.config";

// --- types
import type { ImageProps } from "@upmind-automation/upmind-ui";
import type { ProductCardSkeletonProps } from "./types";

const props = defineProps<ProductCardSkeletonProps>();

const { ui } = useConfig();

const stylesMeta = computed(() => ({
  variant: ui.productStyle.value,
  imageRatio: ui.productImageRatio.value,
  hideBenefits: ui.productBenefits.isHidden,
  hideImage: ui.productImages.isHidden,
  hideDescription: ui.productDescription.isHidden,
  hidePrice: ui.productPriceSummary.isHidden,
  hideTerms: ui.productTermSelector.isHidden,
  hideTermSummary: ui.termSelectorSummary.isHidden
}));

const randomWidth = (baseWidth: string): string => {
  const widthMap: Record<string, string[]> = {
    "w-20": ["w-12", "w-16", "w-20", "w-24", "w-28"],
    "w-24": ["w-16", "w-20", "w-24", "w-28", "w-32"],
    "w-28": ["w-20", "w-24", "w-28", "w-32", "w-36"],
    "w-32": ["w-24", "w-28", "w-32", "w-36", "w-40"],
    "w-36": ["w-28", "w-32", "w-36", "w-40", "w-44"],
    "w-40": ["w-32", "w-36", "w-40", "w-44", "w-48"],
    "w-44": ["w-36", "w-40", "w-44", "w-48", "w-52"],
    "w-48": ["w-40", "w-44", "w-48", "w-52", "w-56"],
    "w-52": ["w-44", "w-48", "w-52", "w-56", "w-60"],
    "w-56": ["w-48", "w-52", "w-56", "w-60", "w-64"],
    "w-60": ["w-52", "w-56", "w-60", "w-64", "w-72"],
    "w-64": ["w-56", "w-60", "w-64", "w-72", "w-80"],
    "w-72": ["w-60", "w-64", "w-72", "w-80", "w-96"],
    "w-80": ["w-64", "w-72", "w-80", "w-96", "w-full"],
    "w-96": ["w-72", "w-80", "w-96", "w-full", "w-full"],
    "w-3/4": ["w-2/3", "w-3/4", "w-4/5"],
    "w-2/3": ["w-3/5", "w-2/3", "w-3/4"],
    "w-1/2": ["w-2/5", "w-1/2", "w-3/5"]
  };

  const alternatives = widthMap[baseWidth];
  if (!alternatives) return baseWidth;
  return alternatives[Math.floor(Math.random() * alternatives.length)];
};

const styles = useStyles(
  [
    "product",
    "product.header",
    "product.header.info",
    "product.header.price",
    "product.header.price.currentPrice"
  ],
  stylesMeta,
  config
);
</script>
