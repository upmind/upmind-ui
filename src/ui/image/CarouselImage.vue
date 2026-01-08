<template>
  <CarouselItem :class="styles.image.carousel.item">
    <img :src="image.url" :alt="image.alt" :class="styles.image.root" />
  </CarouselItem>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- internal
import config from "./image.config";
import { useStyles } from "../../utils";

// --- components
import { CarouselItem } from "../carousel";

// --- types
import type { CarouselImageProps } from "./types";

const props = defineProps<CarouselImageProps>();

const imageMeta = computed(() => ({
  position: (() => {
    if (props.index === 0) return "first";
    if (props.index === (props.total ?? 0) - 1) return "last";
    return "middle";
  })()
}));

const styles = useStyles(
  ["image", "image.carousel", "image.nav"],
  imageMeta,
  config
);
</script>
