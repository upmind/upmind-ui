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
        :class="styles.header.image.root"
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
import { useStyles } from "@upmind-automation/upmind-ui";
import Hero from "../../../../components/hero/Hero.vue";
import ProductDescription from "../card/ProductDescription.vue";
import DisplayPrice from "../terms/DisplayPrice.vue";
import config from "./product-hero.config";
import ProductImage from "./ProductImage.vue";
import { toNumber } from "lodash-es";
import type { ProductHeaderProps } from "./types";
import type { HeroProps } from "../../../../components/hero/types";

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

const styles = useStyles(["header", "header.image"], stylesMeta, config);

const detailsRef = ref<HTMLElement | null>(null);
const { height } = useElementSize(detailsRef);
</script>
