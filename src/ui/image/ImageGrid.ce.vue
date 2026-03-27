<template>
  <div :class="styles.imageGrid.container">
    <!-- Preview image -->
    <figure
      class="group"
      :class="cn(styles.imageGrid.preview, props.class)"
      :style="meta.hasFallback ? fallbackStyle : ''"
      @click="openLightbox"
    >
      <img
        v-if="!meta.isEmpty"
        :src="activeImage?.url"
        :alt="activeImage?.alt"
        :class="styles.imageGrid.previewImage"
        @error="error = true"
      />

      <!-- Hover overlay with expand icon -->
      <div v-if="!meta.isEmpty" :class="styles.imageGrid.overlay">
        <Icon
          icon="expand-01"
          size="lg"
          :class="styles.imageGrid.overlayIcon"
        />
      </div>

      <!-- Fallback icon -->
      <div v-if="meta.hasFallback" :class="cn(styles.imageGrid.previewImage)">
        <Icon :icon="props.icon" size="lg" :class="styles.imageGrid.icon" />
      </div>
    </figure>

    <!-- Thumbnail carousel -->
    <Carousel
      v-if="images.length > 1"
      v-resize-observer="setThumbnailsActive"
      :key="`thumbnails-${thumbnailsActive}`"
      @init-api="setThumbnailApi"
      :opts="{
        loop: false,
        dragFree: true,
        watchDrag: thumbnailsActive
      }"
    >
      <CarouselContent :class="styles.imageGrid.thumbnails" overflow>
        <CarouselItem
          v-for="(img, index) in images"
          :key="img.url || index"
          :class="styles.imageGrid.thumbnailItem"
        >
          <button
            :class="thumbnailClass(index === activeIndex)"
            @click="selectImage(index)"
            type="button"
          >
            <img
              :src="img.url"
              :alt="img.alt"
              :class="styles.imageGrid.thumbnailImage"
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
import { Carousel, CarouselContent, CarouselItem } from "../carousel";
import { Icon } from "../icon";
import ImagePreview from "./ImagePreview.vue";
// --- utils
import { useStyles, cn, getComputedColor } from "../../utils";
import { isEmpty, isArray } from "lodash-es";
// --- types
import type { ImageGridProps, ImageItem } from "./types";
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
const error = ref(false);

const images = computed<ImageItem[]>(() =>
  isArray(props.image) ? props.image : []
);

const activeImage = computed(() => images.value[activeIndex.value]);

const meta = computed(() => ({
  ratio: props.ratio,
  fit: props.fit,
  position: props.position,
  isEmpty: isEmpty(props.image) || error.value,
  hasFallback: props.fallback && (isEmpty(props.image) || error.value)
}));

const styles = useStyles(["imageGrid"], meta, config);

const fallbackStyle = computed(() => {
  const color = getComputedColor("accent-neutral");
  return `background: radial-gradient(${color} 2px, transparent 2px) 50% 50% / 20px 20px repeat;`;
});

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
  if (!meta.value.isEmpty) {
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
    error.value = false;
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
