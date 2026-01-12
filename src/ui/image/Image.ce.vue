<template>
  <!-- Multiple images with carousel -->
  <Carousel
    @init-api="onCarouselInit"
    v-if="meta.isCarousel && (!meta.isEmpty || meta.hasFallback)"
    :class="cn(styles.image.container, props.class)"
  >
    <CarouselContent :class="styles.image.carousel.content" class="ml-0 h-full">
      <template v-for="(data, index) in image as ImageItem[]">
        <CarouselImage
          :image="data"
          :index="index"
          :total="meta.imageLength"
          :fit="props.fit"
          :position="props.position"
        />
      </template>
    </CarouselContent>

    <nav :class="styles.image.nav.root" @click.prevent.stop>
      <span
        v-for="(img, index) in image as ImageItem[]"
        :key="index"
        :class="styles.image.nav.item"
      >
        <div
          :class="[
            'h-2 w-2 cursor-pointer rounded-full bg-current',
            isSelected(index) ? '' : 'opacity-50'
          ]"
          @click="selectImage(index)"
        />
      </span>
    </nav>
  </Carousel>

  <figure
    v-if="!meta.isCarousel && (!meta.isEmpty || meta.hasFallback)"
    :class="cn(styles.image.container, props.class)"
    :style="meta.hasFallback ? fallbackStyle : ''"
  >
    <!-- Single image with fallback -->
    <picture v-if="!meta.isEmpty" class="contents w-full">
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
  </figure>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";

// --- components
import { Carousel, CarouselContent } from "../carousel";
import CarouselImage from "./CarouselImage.vue";
import { Icon } from "../icon";

// --- internal
import config from "./image.config";

// --- utils
import { isEmpty, isArray, isString } from "lodash-es";
import { useStyles, cn, getComputedColor } from "../../utils";

// --- types
import type { ImageProps, ImageItem } from "./types";
import type { CarouselApi } from "../carousel";

const props = withDefaults(defineProps<ImageProps>(), {
  ratio: "1:1",
  fit: "cover",
  position: "center",
  mode: "auto",
  icon: "camera-01",
  fallback: true
});

const meta = computed(() => {
  const imageList = isArray(props.image) ? props.image : [];
  const imageLength = imageList.length;

  const isCarousel = {
    single: false,
    carousel: imageLength >= 1,
    auto: imageLength > 1
  }[props.mode];

  return {
    ratio: props.ratio,
    fit: props.fit,
    position: props.position,
    isEmpty: isEmpty(props.image) || error.value,
    hasFallback: props.fallback && (isEmpty(props.image) || error.value),
    isCarousel,
    imageLength
  };
});

const styles = useStyles(
  ["image", "image.carousel", "image.nav"],
  meta,
  config
);

const imageIndex = ref(0);
const carouselApi = ref<CarouselApi>();
const error = ref(false);

function onCarouselInit(api: CarouselApi) {
  carouselApi.value = api;

  if (api) {
    api.on("select", () => {
      imageIndex.value = api.selectedScrollSnap() || 0;
    });
  }
}

const currentImage = computed(() => {
  if (isArray(props?.image)) {
    return props?.image?.[imageIndex.value];
  }

  return props?.image;
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
