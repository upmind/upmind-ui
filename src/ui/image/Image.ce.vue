<template>
  <picture v-if="!meta.isEmpty" :class="styles.image.container">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-in-out"
      leave-active-class="transition-opacity duration-300 ease-in-out absolute inset-0 w-full h-full object-cover object-center"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <img
        :key="currentImage?.url"
        :src="currentImage?.url"
        :alt="currentImage?.alt"
        :class="cn(styles.image.root, props.class)"
      />
    </Transition>

    <nav
      v-if="isArray(images) && images.length > 1"
      :class="styles.image.nav.root"
      @click.prevent.stop
    >
      <Icon
        v-for="(image, index) in images"
        :key="index"
        icon="ellipse"
        size="3xs"
        :class="[styles.image.nav.item, isSelected(index) ? '' : 'opacity-50']"
        @click="selectImage(index)"
      />
    </nav>
  </picture>

  <picture v-else :class="cn(styles.image.root, props.class)">
    <Icon icon="camera" size="xl" :class="styles.image.icon" />
  </picture>
</template>

<script setup lang="ts">
// --- external
import { ref, computed, Transition } from "vue";

// --- components
import { Icon } from "../icon";

// --- internal
import config from "./image.config";

// --- utils
import { isEmpty, isArray } from "lodash-es";
import { useStyles, cn } from "../../utils";

// --- types
import type { ComputedRef } from "vue";
import type { ImageProps } from "./types";

const props = withDefaults(defineProps<ImageProps>(), {
  ratio: "3:2",
  fit: "cover"
});

const meta = computed(() => ({
  ratio: props.ratio,
  fit: props.fit,
  isEmpty: isEmpty(props.images)
}));

const styles = useStyles(["image", "image.nav"], meta, config) as ComputedRef<{
  image: {
    container: string;
    root: string;
    icon: string;
    nav: {
      root: string;
      item: string;
    };
  };
}>;

const imageIndex = ref(0);

const currentImage = computed(() => {
  if (isArray(props?.images)) {
    return props?.images?.[imageIndex.value];
  }

  return props?.images;
});

function selectImage(index: number) {
  imageIndex.value = index;
}

function isSelected(index: number) {
  return imageIndex.value === index;
}
</script>
