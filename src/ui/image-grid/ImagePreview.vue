<template>
  <DialogRoot :open="props.open" @update:open="emits('update:open', $event)">
    <DialogPortal>
      <DialogContent
        :class="styles.preview.dialog"
        @touchstart="onTouchStart"
        @wheel="onWheel"
        @click.self="emits('update:open', false)"
      >
        <img
          v-if="props.image?.url"
          ref="imageRef"
          :src="props.image.previewUrl ?? props.image.url"
          :alt="props.image.alt"
          :class="styles.preview.image"
          :style="zoomStyle"
          draggable="false"
          @click="onImageClick"
        />

        <Link
          icon="x-close"
          color="inherit"
          :class="styles.preview.close"
          @click="emits('update:open', false)"
        />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { DialogContent, DialogPortal, DialogRoot } from "radix-vue";
import { Link } from "../link";
import config from "./imageGrid.config";
import { useImageZoom, useStyles } from "../../utils";

import type { ImagePreviewProps } from "./types";

const props = defineProps<ImagePreviewProps>();
const emits = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const imageRef = ref<HTMLImageElement | null>(null);

const { zoomStyle, isZoomed, onImageClick, onWheel, onTouchStart, reset } =
  useImageZoom(imageRef);

const meta = computed(() => ({
  isZoomed: isZoomed.value
}));

const styles = useStyles(["preview"], meta, config);

// Reset zoom when dialog closes
watch(
  () => props.open,
  open => {
    if (!open) reset();
  }
);
</script>
