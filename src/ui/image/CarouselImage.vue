<template>
  <CarouselItem :class="styles.image.carousel.item">
    <img :src="image.url" :alt="image.alt" :class="styles.image.root" />
  </CarouselItem>
</template>

<script setup lang="ts">
import { useStyles, cn } from "../../utils";
import { CarouselItem } from "../carousel";
import { computed } from "vue";
import config from "./image.config";
import type { ImageItem } from "./types";
import type { ComputedRef } from "vue";

const props = defineProps<{
  image: ImageItem;
  index?: number;
  total?: number;
}>();

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
) as ComputedRef<{
  image: {
    container: string;
    root: string;
    icon: string;
    carousel: {
      root: string;
      content: string;
      item: string;
    };
    nav: {
      root: string;
      item: string;
    };
  };
}>;
</script>
