<template>
  <div
    v-if="ui.productImagesStyle.isGrid && isArray(mappedImage)"
    :class="
      cn(headerImageGridVariants({ direction: props.direction }), props.class)
    "
  >
    <ImageGrid
      v-if="isArray(mappedImage)"
      :thumbnails-label="t('text.thumbnails')"
      :expand-label="t('text.expand_image')"
      :nav-label="t('text.image_navigation')"
      :preview-close-label="t('action.close')"
      :image="mappedImage"
      fit="cover"
      :ratio="ui.productImageRatio.value"
      :fallback="props.fallback"
    />
  </div>
  <Image
    :expand-label="t('text.expand_image')"
    :nav-label="t('text.image_navigation')"
    :preview-close-label="t('action.close')"
    v-else
    :image="mappedImage"
    fit="cover"
    :ratio="ui.productImageRatio.value"
    :mode="ui.productImagesStyle.isGrid ? 'auto' : ui.productImagesStyle.value"
    :class="cn(headerImageProductVariants(), props.class)"
    :fallback="props.fallback"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useConfig, useImageUrl } from "@upmind-automation/headless";
import { cn } from "@upmind/ui";
import { Image, ImageGrid } from "@upmind/ui";
import {
  headerImageGridVariants,
  headerImageProductVariants
} from "./variants";
import { isArray, isEmpty } from "lodash-es";
import type { ProductImageProps } from "./types";
import type { ImageItem } from "@upmind/ui";

const { t } = useI18n();
const props = withDefaults(defineProps<ProductImageProps>(), {
  previewSize: "original"
});

const { ui } = useConfig().with({
  product: () => props
});

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
