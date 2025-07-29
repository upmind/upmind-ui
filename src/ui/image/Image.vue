<template>
  <Transition name="fade">
    <picture v-if="!isEmpty(images)" :class="styles.images.root">
      <img
        :key="currentImage?.url"
        :src="currentImage?.url"
        :alt="currentImage?.alt"
      />
    </picture>
  </Transition>
</template>

<script setup lang="ts">
// --- external
import { ref, computed, Transition } from "vue";

// --- components
import { useStyles } from "../../utils";

// --- internal
import config from "./image.config";

// --- utils
import { isEmpty, isArray } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ImageProps } from "./types";

const props = defineProps<ImageProps>();

const styles = useStyles(["images"], {}, config) as ComputedRef<{
  images: {
    root: string;
  };
}>;

const imageIndex = ref(0);
const currentImage = computed(() => {
  if (isArray(props?.images)) {
    return props?.images?.[imageIndex.value];
  }

  return props?.images;
});
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
