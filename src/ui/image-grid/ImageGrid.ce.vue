<template>
  <div :class="styles.imageGrid.container">
    <!-- Preview carousel -->
    <div :class="styles.imageGrid.preview.wrapper">
      <Image
        :index="activeIndex"
        @update:index="moveTo"
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
      tabindex="-1"
      @init-api="setThumbnailApi"
      :opts="{
        loop: false,
        dragFree: true,
        watchDrag: thumbnailsActive,
        inViewThreshold: 1
      }"
    >
      <CarouselContent :class="styles.imageGrid.thumbnails.content" overflow>
        <CarouselItem
          v-for="(img, index) in images"
          :key="img.url || index"
          :class="styles.imageGrid.thumbnails.item"
        >
          <button
            ref="thumbnailRefs"
            :class="thumbnailClass(index === activeIndex)"
            :tabindex="index === activeIndex ? 0 : -1"
            @click="selectImage(index)"
            @keydown="onThumbnailKey($event, index)"
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
import { useStyles, useArrowNavigation } from "../../utils";
import { isArray, includes } from "lodash-es";
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
const thumbnailRefs = ref<HTMLButtonElement[]>([]);

function setThumbnailApi(api: CarouselApi) {
  thumbnailApi.value = api;
}

const { onKey: onThumbnailKey } = useArrowNavigation({
  refs: thumbnailRefs,
  count: () => images.value.length,
  onSelect: moveTo
});

function setThumbnailsActive() {
  thumbnailsActive.value =
    (thumbnailApi.value?.containerNode()?.scrollWidth ?? 0) >
    (thumbnailApi.value?.containerNode()?.clientWidth ?? 0);
}

// --- actions
function selectImage(index: number) {
  // Thumbnail click — set the active image without scrolling the grid
  activeIndex.value = index;
  // Give the user time to look at their pick before autoplay advances again
  startAutoplay(props.autoplay * 3);
}

function moveTo(index: number) {
  // Preview swipe / autoplay — set the active image and follow it in the grid
  const prev = activeIndex.value;
  if (index === prev) return;
  activeIndex.value = index;

  const api = thumbnailApi.value;
  // Skip when the new active is already fully in view (inViewThreshold: 1)
  if (!api || includes(api.slidesInView(), index)) return;
  // Multi-step jump (e.g. autoplay wrapping back to 0) — center the target
  const step = index - prev;
  if (Math.abs(step) > 1) return api.scrollTo(index);
  // Single step — shift by one slot so the new slide enters at the edge
  step > 0 ? api.scrollNext() : api.scrollPrev();
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
let autoplayTimer: ReturnType<typeof setTimeout> | undefined;

function startAutoplay(firstDelay = props.autoplay) {
  stopAutoplay();
  if (!props.autoplay || images.value.length <= 1) return;
  autoplayTimer = setTimeout(() => {
    moveTo((activeIndex.value + 1) % images.value.length);
    startAutoplay();
  }, firstDelay * 1000);
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearTimeout(autoplayTimer);
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
