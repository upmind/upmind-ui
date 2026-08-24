<template>
  <section :class="headerRootVariants({ direction: props.direction })">
    <div
      :class="headerDetailsVariants({ hasImage: stylesMeta.hasImage })"
      ref="detailsRef"
    >
      <Hero
        :title="meta.data.productName || props.productDetails.title"
        :title-class="headerHeroTitleVariants({ direction: props.direction })"
        :description-class="
          headerHeroDescriptionVariants({ direction: props.direction })
        "
        :badge="
          meta.ui.productBadge.isVisible && meta.data.productBadge
            ? meta.data.productBadge
            : undefined
        "
      >
        <template #prepend>
          <slot name="prepend" />
        </template>

        <template #subtitle>
          <DisplayPrice
            v-if="
              meta.ui.productAnchorPrice.isVisible &&
              props.productDetails?.displayPrice
            "
            v-bind="props.productDetails.displayPrice"
            :class="headerPriceVariants({ direction: props.direction })"
          />
        </template>

        <template #description>
          <ProductDescription
            v-if="
              productDetails?.description &&
              meta.ui.productDescription.isVisible
            "
            :description="productDetails?.description"
            :lineclamp="meta.ui.productDescription.isClamped"
            :lines="toNumber(meta.ui.productDescriptionClamp?.value)"
          />
        </template>

        <template #append>
          <slot name="append" />
        </template>
      </Hero>
    </div>

    <aside
      v-if="stylesMeta.hasImage"
      :class="headerAsideVariants({ direction: props.direction })"
      :style="{ '--details-h': `${height}px` }"
    >
      <ProductImage
        :class="headerImageRootVariants()"
        :product-details="props.productDetails"
        :direction="props.direction"
        :fallback="meta.ui.productImageFallback.isVisible"
      />
    </aside>
  </section>
</template>

<script setup lang="ts">
import { useElementSize } from "@vueuse/core";
import { computed, ref } from "vue";
import Hero from "../../../../components/hero/Hero.vue";
import ProductDescription from "../card/ProductDescription.vue";
import DisplayPrice from "../terms/DisplayPrice.vue";
import ProductImage from "./ProductImage.vue";
import {
  headerRootVariants,
  headerDetailsVariants,
  headerPriceVariants,
  headerAsideVariants,
  headerImageRootVariants,
  headerHeroTitleVariants,
  headerHeroDescriptionVariants
} from "./variants";
import { toNumber } from "lodash-es";
import type { ProductHeaderProps } from "./types";

const props = withDefaults(defineProps<ProductHeaderProps>(), {
  direction: "horizontal",
  image: true
});

const stylesMeta = computed(() => ({
  direction: props.direction,
  hasImage:
    !!(props.productDetails?.imgUrl || props.productDetails?.images?.length) &&
    props.image
}));

const detailsRef = ref<HTMLElement | null>(null);
const { height } = useElementSize(detailsRef);
</script>
