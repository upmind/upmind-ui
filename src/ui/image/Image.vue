<template>
  <picture v-if="!isEmpty(images)" :class="styles.image.container">
    <Transition name="fade">
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
    >
      <span v-for="(image, index) in images" :key="index" class="size-5 p-1">
        <Icon
          icon="ellipse"
          @click.prevent="selectImage(index)"
          :class="[
            styles.image.nav.item,
            isSelected(index) ? '' : 'opacity-50'
          ]"
        />
      </span>
    </nav>
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
  ratio: "3:2"
});

const meta = computed(() => ({
  ratio: props.ratio
}));

const styles = useStyles(["image", "image.nav"], meta, config) as ComputedRef<{
  image: {
    container: string;
    root: string;
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

<style scoped>
.fade-enter-active {
  transition: opacity 0.3s ease;
}

.fade-leave-active {
  transition: opacity 0.3s ease;
  position: absolute;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
