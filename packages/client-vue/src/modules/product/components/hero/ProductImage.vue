<template>
  <div
    v-if="ui.productImagesStyle.isGrid && isArray(mappedImage)"
    :class="cn(props.class, styles.header.image.grid)"
  >
    <ImageGrid
      :image="mappedImage"
      fit="cover"
      :ratio="ui.productImageRatio.value"
      :fallback="props.fallback"
    />
  </div>
  <Image
    v-else
    :image="mappedImage"
    fit="cover"
    :ratio="ui.productImageRatio.value"
    :mode="ui.productImagesStyle.isGrid ? 'auto' : ui.productImagesStyle.value"
    :class="cn(styles.header.image.product, props.class)"
    :fallback="props.fallback"
  />
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- components
import { Image, ImageGrid, useStyles, cn } from "@upmind-automation/upmind-ui";

// --- internal
import { useConfig, useImageUrl } from "@upmind-automation/headless";
import config from "./product-hero.config";

// --- utils
import { isArray, isEmpty } from "lodash-es";

// --- types
import type { ProductImageProps } from "./types";
import type { ImageItem } from "@upmind-automation/upmind-ui";

const props = withDefaults(defineProps<ProductImageProps>(), {
  previewSize: "original"
});

const { ui } = useConfig().with({
  product: () => props
});

const stylesMeta = computed(() => ({
  direction: props.direction
}));

const styles = useStyles(["header", "header.image"], stylesMeta, config);

const images = computed(() => {
  return props.productDetails?.images?.map(image => ({
    url: image.url,
    alt: props.productDetails?.title,
    previewUrl: useImageUrl(image.url, props.previewSize)
  })) as ImageItem[];
});

// Compute the image prop value - wrap single imgUrl in array when carousel mode
// is explicitly set, otherwise fallback to string for single image display
const mappedImage = computed(() => {
  if (!isEmpty(images.value)) {
    return images.value;
  }

  // When carousel or grid mode is explicitly set, wrap single imgUrl in array
  if (
    (ui.productImagesStyle.isCarousel || ui.productImagesStyle.isGrid) &&
    props.productDetails?.imgUrl
  ) {
    return [
      {
        url: props.productDetails.imgUrl,
        alt: props.productDetails?.title,
        previewUrl: useImageUrl(props.productDetails.imgUrl, props.previewSize)
      }
    ] as ImageItem[];
  }

  // Default fallback to string for single image display (auto/single modes)
  return props.productDetails?.imgUrl;
});
</script>
