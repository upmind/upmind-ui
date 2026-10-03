<template>
  <article
    :class="
      cn([
        cardRootVariants({ isExactMatch: meta.isExactMatch }),
        cardSkeletonRootVariants({ isExactMatch: meta.isExactMatch })
      ])
    "
    class="border-stroke border-t"
  >
    <header :class="cardHeaderRootVariants()">
      <div :class="cardHeaderDetailsRootVariants()" class="flex flex-col gap-2">
        <Skeleton :active="meta.isActive" class="h-4 w-20" />

        <section :class="cardHeaderDetailsTitleRootVariants()">
          <Skeleton
            :active="meta.isActive"
            :class="[
              cardSkeletonTitleVariants({ isExactMatch: meta.isExactMatch }),
              `w-${randomTitleWidth}`
            ]"
          />
        </section>

        <Skeleton
          :active="meta.isActive"
          class="h-4"
          :class="[`w-${randomDescWidth}`]"
        />
      </div>
    </header>

    <footer
      :class="cardFooterRootVariants()"
      class="mt-4 flex-col lg:mt-0 lg:flex-row"
    >
      <section :class="cardFooterPriceRootVariants()">
        <Skeleton :active="meta.isActive" class="h-6 w-24" />
      </section>

      <Skeleton
        :active="meta.isActive"
        class="rounded-button h-11"
        :class="cardSkeletonButtonVariants({ isExactMatch: meta.isExactMatch })"
      />
    </footer>
  </article>
</template>

<script setup lang="ts">
import { Skeleton } from "@upmind/ui";
import { cn } from "@upmind/ui";
import { computed } from "vue";
import {
  cardRootVariants,
  cardHeaderRootVariants,
  cardHeaderDetailsRootVariants,
  cardHeaderDetailsTitleRootVariants,
  cardFooterRootVariants,
  cardFooterPriceRootVariants,
  cardSkeletonRootVariants,
  cardSkeletonTitleVariants,
  cardSkeletonButtonVariants
} from "../variants";
import type { DomainCardSkeletonProps } from "../types";
const props = withDefaults(defineProps<DomainCardSkeletonProps>(), {
  active: true,
  exactMatch: false
});

const meta = computed(() => ({
  isActive: props.active,
  isExactMatch: props.exactMatch
}));

// methods
const descWidthOptions = [56, 64];
const randomDescWidth =
  descWidthOptions[Math.floor(Math.random() * descWidthOptions.length)];

const titleWidthOptions = [56, 64, 72];
const randomTitleWidth =
  titleWidthOptions[Math.floor(Math.random() * titleWidthOptions.length)];
</script>
