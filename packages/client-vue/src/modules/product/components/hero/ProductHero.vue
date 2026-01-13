<template>
  <section :class="styles.header.root">
    <div :class="styles.header.details" ref="detailsRef">
      <slot name="prepend" />

      <hgroup>
        <h1 :class="styles.header.title">
          {{ productDetails?.title }}
        </h1>
        <DisplayPrice
          v-if="props.productDetails?.displayPrice"
          v-bind="props.productDetails.displayPrice"
          :class="styles.header.price"
        />
      </hgroup>

      <ProductDescription
        v-if="productDetails?.description"
        :class="styles.header.description"
        :description="productDetails?.description"
        :lineclamp="true"
      />

      <slot name="append" />
    </div>

    <aside
      v-if="props.image && stylesMeta.hasImage"
      :class="styles.header.aside"
      :style="{ '--details-h': `${height}px` }"
    >
      <ProductImage
        :class="styles.header.image"
        :product-details="props.productDetails"
        :images="props.productDetails?.images"
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
import ProductDescription from "../card/ProductDescription.vue";
import ProductImage from "./ProductImage.vue";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./product-hero.config";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ProductHeaderProps } from "./types";
import type { ImageItem } from "@upmind-automation/upmind-ui";
import type { ImageProps } from "@upmind-automation/upmind-ui";

const props = withDefaults(defineProps<ProductHeaderProps>(), {
  direction: "horizontal",
  image: true
});

const stylesMeta = computed(() => ({
  direction: props.direction,
  hasImage: !!(props.productDetails?.imgUrl || !isEmpty(images.value))
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
