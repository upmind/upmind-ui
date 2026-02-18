<template>
  <section :class="styles.header.root">
    <div :class="styles.header.details" ref="detailsRef">
      <Hero
        :title="meta.data.productName || props.productDetails.title"
        :badge="
          meta.ui.productBadge.isVisible && meta.data.productBadge
            ? (meta.data.productBadge as HeroProps['badge'])
            : undefined
        "
        :ui-config="{
          hero: {
            title: [styles.header.heroTitle],
            description: [styles.header.heroDescription]
          }
        }"
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
            :class="styles.header.price"
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

          <p v-if="productDetails?.excerpt && meta.ui.productExcerpt.isVisible">
            {{ productDetails?.excerpt }}
          </p>
        </template>

        <template #append>
          <slot name="append" />
        </template>
      </Hero>
    </div>

    <aside
      v-if="stylesMeta.hasImage"
      :class="styles.header.aside"
      :style="{ '--details-h': `${height}px` }"
    >
      <ProductImage
        :class="styles.header.image"
        :product-details="props.productDetails"
        :images="props.productDetails?.images"
        :fallback="meta.ui.productImageFallback.isVisible"
      />
    </aside>
  </section>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
import { useElementSize } from "@vueuse/core";

// --- components
import DisplayPrice from "../terms/DisplayPrice.vue";
import Hero from "../../../../components/hero/Hero.vue";
import ProductDescription from "../card/ProductDescription.vue";
import ProductImage from "./ProductImage.vue";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./product-hero.config";

// --- utils
import { isEmpty, toNumber } from "lodash-es";

// --- types
import type { ProductHeaderProps } from "./types";
import type { HeroProps } from "../../../../components/hero/types";
import type { ImageItem } from "@upmind-automation/upmind-ui";

const props = withDefaults(defineProps<ProductHeaderProps>(), {
  direction: "horizontal",
  image: true
});

const stylesMeta = computed(() => ({
  direction: props.direction,
  hasImage:
    !!(props.productDetails?.imgUrl || !isEmpty(images.value)) && props.image
}));

const styles = useStyles(["header"], stylesMeta, config);

const images = computed(() => {
  return props.productDetails?.images?.map(image => ({
    url: image.url,
    alt: props.productDetails?.title
  })) as ImageItem[];
});

const detailsRef = ref<HTMLElement | null>(null);
const { height } = useElementSize(detailsRef);
</script>
