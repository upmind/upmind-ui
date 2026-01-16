<template>
  <Image
    :image="isEmpty(images) ? props.productDetails.imgUrl : images"
    fit="cover"
    :ratio="ui.productImageRatio.value"
    :mode="mode"
    :class="props.class"
    class="h-full"
    :fallback="props.fallback"
  />
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- components
import { Image } from "@upmind-automation/upmind-ui";

// --- internal
import { useConfig } from "@upmind-automation/headless";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ProductImageProps } from "./types";
import type { ImageItem, ImageMode } from "@upmind-automation/upmind-ui";
import { UIContext, IMAGES_STYLE } from "@upmind-automation/headless";

const props = defineProps<ProductImageProps>();

const { ui } = useConfig({
  product: () => props
});

const images = computed(() => {
  return props.productDetails?.images?.map(image => ({
    url: image.url,
    alt: props.productDetails?.title
  })) as ImageItem[];
});

const mode = computed<ImageMode>(() => {
  const style = ui.productImagesStyle.value;
  // TODO: Implement image grid
  if (style === IMAGES_STYLE.GRID) return IMAGES_STYLE.AUTO;
  return style;
});
</script>
