<template>
  <section :class="styles.header.root">
    <div :class="styles.header.details" ref="detailsRef">
      <hgroup>
        <h1 :class="styles.header.title">
          {{ productDetails?.title }}
        </h1>
        <DisplayPrice :product-details="productDetails" class="text-xl" />
      </hgroup>

      <ProductDescription
        v-if="productDetails?.description"
        :class="styles.header.description"
        :description="productDetails?.description"
        :lineclamp="true"
      />
    </div>

    <aside
      :class="styles.header.aside"
      class="md:h-[var(--details-h)]"
      :style="{ '--details-h': `${height}px` }"
    >
      <Image
        :image="isEmpty(images) ? props.productDetails.imgUrl : images"
        fit="cover"
        :ratio="
          productDetails?.uiMeta?.product?.image?.ratio as ImageProps['ratio']
        "
        class="h-full"
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
import { Image, useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./header.config";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ProductHeaderProps } from "../types";
import type { ImageItem } from "@upmind-automation/upmind-ui";
import type { ImageProps } from "@upmind-automation/upmind-ui";
import type { ComputedRef } from "vue";

const props = defineProps<ProductHeaderProps>();

const styles = useStyles(["header"], {}, config) as ComputedRef<{
  header: {
    root: string;
    details: string;
    title: string;
    description: string;
    price: string;
    aside: string;
  };
}>;
const images = computed(() => {
  return props.productDetails?.images?.map(image => ({
    url: image.url,
    alt: props.productDetails?.title
  })) as ImageItem[];
});

const detailsRef = ref<HTMLElement | null>(null);
const { height } = useElementSize(detailsRef);
</script>
