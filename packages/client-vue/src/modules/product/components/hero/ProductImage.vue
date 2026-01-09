<template>
  <Image
    :image="isEmpty(images) ? props.productDetails.imgUrl : images"
    fit="cover"
    :ratio="
      productDetails?.uiMeta?.product?.image?.ratio as ImageProps['ratio']
    "
    :class="props.class"
    class="h-full"
  />
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- components
import { Image } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./product-hero.config";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ProductImageProps } from "./types";
import type { ImageItem } from "@upmind-automation/upmind-ui";
import type { ImageProps } from "@upmind-automation/upmind-ui";

const props = defineProps<ProductImageProps>();

const images = computed(() => {
  return props.productDetails?.images?.map(image => ({
    url: image.url,
    alt: props.productDetails?.title
  })) as ImageItem[];
});
</script>
