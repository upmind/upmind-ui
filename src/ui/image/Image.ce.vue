<template>
  <!-- Multiple images with carousel -->
  <Carousel
    @init-api="onCarouselInit"
    v-if="meta.isCarousel"
    :class="cn(styles.image.container, props.class)"
  >
    <CarouselContent
      :class="styles.image.carousel.content"
      class="-ml-0 h-full"
    >
      <template v-for="(data, index) in image">
        <CarouselImage :image="data" :index="index" :total="meta.imageLength" />
      </template>
    </CarouselContent>

    <nav :class="styles.image.nav.root" @click.prevent.stop>
      <span
        v-for="(image, index) in image"
        :key="index"
        :class="styles.image.nav.item"
      >
        <Icon
          icon="ellipse"
          size="3xs"
          :class="[isSelected(index) ? '' : 'opacity-50']"
          @click="selectImage(index)"
        />
      </span>
    </nav>
  </Carousel>

  <figure
    v-if="!meta.isCarousel"
    :class="cn(styles.image.container, props.class)"
    :style="meta.isEmpty ? fallbackStyle : ''"
  >
    <!-- Single image with fallback -->
    <picture v-if="!meta.isEmpty">
      <img
        :key="isString(currentImage) ? currentImage : currentImage?.url"
        :src="isString(currentImage) ? currentImage : currentImage?.url"
        :alt="isString(currentImage) ? '' : currentImage?.alt"
        :class="cn(styles.image.root)"
        @error="error = true"
      />
    </picture>
    <!-- Fallback icon -->
    <div v-if="meta.isEmpty" :class="cn(styles.image.root)">
      <Icon icon="camera-off" size="lg" :class="styles.image.icon" />
    </div>
  </figure>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";

// --- components
import { Icon } from "../icon";
import { Carousel, CarouselContent } from "../carousel";
import CarouselImage from "./CarouselImage.vue";

// --- internal
import config from "./image.config";

// --- utils
import { isEmpty, isArray, isString } from "lodash-es";
import { useStyles, cn, getComputedColor } from "../../utils";

// --- types
import type { ComputedRef } from "vue";
import type { ImageProps } from "./types";
import type { CarouselApi } from "../carousel";

const props = withDefaults(defineProps<ImageProps>(), {
  ratio: "1:1",
  fit: "cover",
  carousel: true
});

const meta = computed(() => ({
  ratio: props.ratio,
  fit: props.fit,
  isEmpty: isEmpty(props.image) || error.value,
  isCarousel: props.carousel && isArray(props.image) && props.image.length > 1,
  imageLength: isArray(props.image) ? props.image.length : 0
}));

const styles = useStyles(
  ["image", "image.carousel", "image.nav"],
  meta,
  config
) as ComputedRef<{
  image: {
    container: string;
    root: string;
    icon: string;
    carousel: {
      content: string;
      item: string;
    };
    nav: {
      root: string;
      item: string;
    };
  };
}>;

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
