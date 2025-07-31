<template>
  <figure :class="cn(styles.image.container, props.class)">
    <!-- Multiple images with carousel -->
    <Carousel v-if="meta.isCarousel" @init-api="onCarouselInit">
      <CarouselContent :class="styles.image.carousel.content">
        <CarouselItem
          v-for="(image, index) in images as ImageItem[]"
          :key="index"
          :class="styles.image.carousel.item"
        >
          <img
            :src="image.url"
            :alt="image.alt"
            :class="cn(styles.image.root)"
          />
        </CarouselItem>
      </CarouselContent>

      <nav :class="styles.image.nav.root" @click.prevent.stop>
        <span
          v-for="(image, index) in images"
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

    <!-- Single image -->
    <img
      v-else-if="!meta.isEmpty"
      :key="currentImage?.url"
      :src="currentImage?.url"
      :alt="currentImage?.alt"
      :class="cn(styles.image.root)"
    />

    <!-- Fallback icon -->
    <div v-else :class="cn(styles.image.root)">
      <Icon icon="camera" size="xl" :class="styles.image.icon" />
    </div>
  </figure>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";

// --- components
import { Icon } from "../icon";
import { Carousel, CarouselContent, CarouselItem } from "../carousel";

// --- internal
import config from "./image.config";

// --- utils
import { isEmpty, isArray } from "lodash-es";
import { useStyles, cn } from "../../utils";

// --- types
import type { ComputedRef } from "vue";
import type { ImageProps, ImageItem } from "./types";
import type { CarouselApi } from "../carousel";

const props = withDefaults(defineProps<ImageProps>(), {
  ratio: "3:2",
  fit: "cover",
  carousel: true
});

const meta = computed(() => ({
  ratio: props.ratio,
  fit: props.fit,
  isEmpty: isEmpty(props.images),
  isCarousel: props.carousel && isArray(props.images) && props.images.length > 1
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

function onCarouselInit(api: CarouselApi) {
  carouselApi.value = api;

  if (api) {
    api.on("select", () => {
      imageIndex.value = api.selectedScrollSnap() || 0;
    });
  }
}

const currentImage = computed(() => {
  if (isArray(props?.images)) {
    return props?.images?.[imageIndex.value];
  }

  return props?.images;
});

function selectImage(index: number) {
  imageIndex.value = index;
  carouselApi.value?.scrollTo(index);
}

function isSelected(index: number) {
  return imageIndex.value === index;
}
</script>
