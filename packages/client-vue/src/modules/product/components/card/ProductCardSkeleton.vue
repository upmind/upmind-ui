<template>
  <div :class="cardRootVariants({ variant: stylesMeta.variant })">
    <div :class="cardContentVariants({ variant: stylesMeta.variant })">
      <div v-if="!stylesMeta.hideImage" class="relative">
        <!-- invisible Image sizes the box (preserves its ratio); Skeleton fills it -->
        <Image
          :expand-label="t('text.expand_image')"
          :nav-label="t('text.image_navigation')"
          :preview-close-label="t('action.close')"
          :ratio="stylesMeta.imageRatio as ImageProps['ratio']"
          :class="cardImageRootVariants({ variant: stylesMeta.variant })"
          class="opacity-0"
        />
        <Skeleton class="absolute inset-0 rounded-lg" />
      </div>

      <section
        :class="
          cardDetailsVariants({
            variant: stylesMeta.variant,
            hideTerms: stylesMeta.hideTerms
          })
        "
      >
        <header :class="cardHeaderRootVariants()">
          <section :class="cardHeaderInfoRootVariants()">
            <div :class="cardHeaderInfoContainerVariants()">
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
            :class="cardHeaderPriceRootVariants()"
            class="gap-2"
          >
            <p :class="cardHeaderPriceCurrentPriceRootVariants()">
              <Skeleton :class="`h-9 ${randomWidth('w-28')}`" />
              <Skeleton :class="`ml-1 h-6 ${randomWidth('w-24')}`" />
            </p>

            <Skeleton :class="`h-6 ${randomWidth('w-2/3')}`" />
          </section>

          <Skeleton v-if="!stylesMeta.hideTerms" class="h-11 w-full" />
        </header>

        <footer :class="cardFooterVariants()">
          <Skeleton class="rounded-button h-11 w-full" />
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Image } from "@upmind/ui";
import { Skeleton } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useConfig } from "@upmind-automation/headless";
import {
  cardRootVariants,
  cardContentVariants,
  cardImageRootVariants,
  cardDetailsVariants,
  cardHeaderRootVariants,
  cardHeaderInfoRootVariants,
  cardHeaderInfoContainerVariants,
  cardHeaderPriceRootVariants,
  cardHeaderPriceCurrentPriceRootVariants,
  cardFooterVariants
} from "./variants";
import type { ProductCardSkeletonProps } from "./types";
import type { ImageProps } from "@upmind/ui";

const { t } = useI18n();
defineProps<ProductCardSkeletonProps>();

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
</script>
