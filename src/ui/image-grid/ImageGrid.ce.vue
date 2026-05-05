<template>
  <div :class="styles.imageGrid.container">
    <!-- Preview carousel -->
    <div :class="styles.imageGrid.preview.wrapper">
      <Image
        v-model:index="activeIndex"
        mode="carousel"
        :image="images"
        :ratio="props.ratio"
        :fit="props.fit"
        :position="props.position"
        :icon="props.icon"
        :fallback="props.fallback"
        :class="props.class"
      />

      <!-- Expand button (top right) -->
      <Button
        v-if="activeImage"
        icon="expand-01"
        iconOnly
        size="sm"
        variant="ghost"
        color="neutral"
        :class="styles.imageGrid.preview.expand"
        @click.prevent.stop="openLightbox"
      />
    </div>

    <!-- Thumbnail carousel -->
    <Carousel
      v-if="images.length > 1"
      v-resize-observer="setThumbnailsActive"
      :key="`thumbnails-${thumbnailsActive}`"
      :class="styles.imageGrid.thumbnails.root"
      @init-api="setThumbnailApi"
      :opts="{
        loop: false,
        dragFree: true,
        watchDrag: thumbnailsActive
      }"
    >
      <CarouselContent :class="styles.imageGrid.thumbnails.content" overflow>
        <CarouselItem
          v-for="(img, index) in images"
          :key="img.url || index"
          :class="styles.imageGrid.thumbnails.item"
        >
          <button
            :class="thumbnailClass(index === activeIndex)"
            @click="selectImage(index)"
            type="button"
          >
            <img
              :src="img.url"
              :alt="img.alt"
              :class="styles.imageGrid.thumbnails.image"
            />
          </button>
        </CarouselItem>
      </CarouselContent>
    </Carousel>

    <!-- Lightbox -->
    <ImagePreview
      v-if="activeImage"
      :image="activeImage"
      :open="lightboxOpen"
      @update:open="lightboxOpen = $event"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed, watch, onUnmounted } from "vue";
import { vResizeObserver } from "@vueuse/components";
// --- internal
import config, { thumbnailVariant } from "./imageGrid.config";
// --- components
import { Button } from "../button";
import { Carousel, CarouselContent, CarouselItem } from "../carousel";
import { Image } from "../image";
import ImagePreview from "./ImagePreview.vue";
// --- utils
import { useStyles } from "../../utils";
import { isArray } from "lodash-es";
// --- types
import type { ImageGridProps } from "./types";
import type { ImageItem } from "../image/types";
import type { CarouselApi } from "../carousel";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ImageGridProps>(), {
  ratio: "1:1",
  fit: "cover",
  position: "center",
  icon: "camera-01",
  fallback: true,
  autoplay: 3.5
});

// --- state
const activeIndex = ref(0);
const lightboxOpen = ref(false);

const images = computed<ImageItem[]>(() =>
  isArray(props.image) ? props.image : []
);

const activeImage = computed(() => images.value[activeIndex.value]);

const styles = useStyles(
  ["imageGrid", "imageGrid.preview", "imageGrid.thumbnails"],
  computed(() => ({})),
  config
);

// --- thumbnail carousel overflow detection
const thumbnailsActive = ref(false);
const thumbnailApi = ref<CarouselApi>();

function setThumbnailApi(api: CarouselApi) {
  thumbnailApi.value = api;
}

function setThumbnailsActive() {
  thumbnailsActive.value =
    (thumbnailApi.value?.containerNode()?.scrollWidth ?? 0) >
    (thumbnailApi.value?.containerNode()?.clientWidth ?? 0);
}

// --- actions
function selectImage(index: number) {
  activeIndex.value = index;
  startAutoplay();
}

function openLightbox() {
  if (activeImage.value) {
    lightboxOpen.value = true;
  }
}

function thumbnailClass(isActive: boolean) {
  return thumbnailVariant({ isActive });
}

// Reset active index when images change
watch(
  () => props.image,
  () => {
    activeIndex.value = 0;
  }
);

// --- autoplay
let autoplayTimer: ReturnType<typeof setInterval> | undefined;

function startAutoplay() {
  stopAutoplay();
  if (!props.autoplay || images.value.length <= 1) return;
  autoplayTimer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % images.value.length;
  }, props.autoplay * 1000);
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = undefined;
  }
}

watch(
  [() => props.autoplay, images, lightboxOpen],
  () => {
    if (lightboxOpen.value) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  },
  { immediate: true }
);

onUnmounted(stopAutoplay);
</script>
