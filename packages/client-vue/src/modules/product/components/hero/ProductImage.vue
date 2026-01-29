<template>
  <Image
    :image="mappedImage"
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
import { IMAGES_STYLE } from "@upmind-automation/headless";

const props = defineProps<ProductImageProps>();

const { ui } = useConfig().with({
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

// Compute the image prop value - wrap single imgUrl in array when carousel mode
// is explicitly set, otherwise fallback to string for single image display
const mappedImage = computed(() => {
  if (!isEmpty(images.value)) {
    return images.value;
  }

  // When carousel mode is explicitly set, wrap single imgUrl in array
  if (mode.value === IMAGES_STYLE.CAROUSEL && props.productDetails?.imgUrl) {
    return [
      {
        url: props.productDetails.imgUrl,
        alt: props.productDetails?.title
      }
    ] as ImageItem[];
  }

  // Default fallback to string for single image display (auto/single modes)
  return props.productDetails?.imgUrl;
});
</script>
