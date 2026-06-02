<template>
  <!-- Multiple images with carousel -->
  <Carousel
    @init-api="onCarouselInit"
    v-if="meta.isCarousel && (!meta.isEmpty || meta.hasFallback)"
    :class="cn(styles.image.container, props.class)"
  >
    <CarouselContent :class="styles.image.carousel.content">
      <CarouselImage
        v-for="(data, index) in image as ImageItem[]"
        :key="data.url || index"
        :image="data"
        :index="index"
        :total="meta.imageLength"
        :fit="props.fit"
        :position="props.position"
      />
    </CarouselContent>

    <nav :class="styles.image.nav.root" @click.prevent.stop>
      <span
        v-for="(img, index) in image as ImageItem[]"
        :key="index"
        :class="styles.image.nav.item"
      >
        <div
          :class="indicatorVariant({ isActive: isSelected(index) })"
          @click="selectImage(index)"
        />
      </span>
    </nav>

    <Button
      v-if="meta.canExpand"
      icon="expand-01"
      icon-only
      size="sm"
      variant="ghost"
      color="neutral"
      :class="styles.image.expand"
      @click.stop.prevent="expanded = true"
    />
  </Carousel>

  <figure
    v-if="!meta.isCarousel && (!meta.isEmpty || meta.hasFallback)"
    :class="cn(styles.image.container, props.class)"
    :style="meta.hasFallback ? fallbackStyle : ''"
  >
    <!-- Single image with fallback -->
    <picture v-if="!meta.isEmpty" :class="styles.image.picture">
      <img
        :key="isString(currentImage) ? currentImage : currentImage?.url"
        :src="isString(currentImage) ? currentImage : currentImage?.url"
        :alt="isString(currentImage) ? props.alt : currentImage?.alt"
        :class="cn(styles.image.root)"
        @error="error = true"
      />
    </picture>
    <!-- Fallback icon -->
    <div v-if="meta.hasFallback" :class="cn(styles.image.root)">
      <Icon :icon="props.icon" size="lg" :class="styles.image.icon" />
    </div>

    <Button
      v-if="meta.canExpand"
      icon="expand-01"
      icon-only
      size="sm"
      variant="ghost"
      color="neutral"
      :class="styles.image.expand"
      @click.stop.prevent="expanded = true"
    />
  </figure>

  <ImagePreview
    v-if="meta.canExpand && currentImage && !isString(currentImage)"
    :image="currentImage"
    v-model:open="expanded"
  />
</template>

<script setup lang="ts">
// --- external
import { ref, computed, watch } from "vue";
// --- components
import { Button } from "../button";
import { Carousel, CarouselContent } from "../carousel";
import { Icon } from "../icon";
import CarouselImage from "./CarouselImage.vue";
import ImagePreview from "./ImagePreview.vue";
// --- internal
import config, { indicatorVariant } from "./image.config";
// --- utils
import { useStyles, cn, getComputedColor } from "../../utils";
import { isEmpty, isArray, isString } from "lodash-es";
// --- types
import type { ImageProps, ImageItem } from "./types";
import type { CarouselApi } from "../carousel";

const props = withDefaults(defineProps<ImageProps>(), {
  ratio: "1:1",
  fit: "cover",
  position: "center",
  mode: "auto",
  icon: "camera-01",
  fallback: true,
  expandable: true
});

const imageIndex = defineModel<number>("index", { default: 0 });
const expanded = defineModel<boolean>("expanded", { default: false });
const carouselApi = ref<CarouselApi>();
const error = ref(false);

const currentImage = computed(() => {
  if (isArray(props?.image)) {
    return props?.image?.[imageIndex.value];
  }

  return props?.image;
});

const meta = computed(() => {
  const imageList = isArray(props.image) ? props.image : [];
  const imageLength = imageList.length;
  const empty = isEmpty(props.image) || error.value;

  const isCarousel = {
    single: false,
    carousel: imageLength >= 1,
    auto: imageLength > 1,
    grid: false
  }[props.mode];

  return {
    ratio: props.ratio,
    fit: props.fit,
    position: props.position,
    isEmpty: empty,
    hasFallback: props.fallback && empty,
    isCarousel,
    imageLength,
    canExpand:
      props.expandable &&
      !!currentImage.value &&
      !isString(currentImage.value) &&
      !empty
  };
});

const styles = useStyles(
  ["image", "image.carousel", "image.nav"],
  meta,
  config
);

function onCarouselInit(api: CarouselApi) {
  carouselApi.value = api;

  if (api) {
    api.on("select", () => {
      imageIndex.value = api.selectedScrollSnap() || 0;
    });
    if (imageIndex.value !== api.selectedScrollSnap()) {
      api.scrollTo(imageIndex.value);
    }
  }
}

watch(imageIndex, value => {
  const api = carouselApi.value;
  if (api && api.selectedScrollSnap() !== value) {
    api.scrollTo(value);
  }
});

function selectImage(index: number) {
  imageIndex.value = index;
  carouselApi.value?.scrollTo(index);
}

function isSelected(index: number) {
  return imageIndex.value === index;
}

const fallbackStyle = computed(() => {
  const color = getComputedColor("accent-neutral");
  return `background: radial-gradient(${color} 2px, transparent 2px) 50% 50% / 20px 20px repeat;`;
});
</script>
