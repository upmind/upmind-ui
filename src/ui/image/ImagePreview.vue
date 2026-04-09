<template>
  <DialogRoot :open="props.open" @update:open="emits('update:open', $event)">
    <DialogPortal>
      <DialogContent
        class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fill-mode-both animation-duration-200 bg-overlay fixed inset-0 z-50 flex touch-none items-center justify-center overflow-hidden p-4 outline-none"
        @wheel="onWheel"
        @click.self="emits('update:open', false)"
      >
        <img
          v-if="props.image?.url"
          ref="imageRef"
          :src="props.image.previewUrl ?? props.image.url"
          :alt="props.image.alt"
          :class="isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'"
          class="image-radius max-h-[90vh] max-w-[90vw] object-contain select-none"
          draggable="false"
          @click="onImageClick"
        />

        <Link
          icon="x-close"
          color="inherit"
          class="text-tooltip absolute top-4 right-4 z-10"
          @click="emits('update:open', false)"
        />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, watch } from "vue";
import { DialogContent, DialogPortal, DialogRoot } from "radix-vue";
import Panzoom from "@panzoom/panzoom";
import { Link } from "../link";

import type { PanzoomObject } from "@panzoom/panzoom";
import type { ImagePreviewProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ImagePreviewProps>();
const emits = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const imageRef = ref<HTMLImageElement | null>(null);
const isZoomed = ref(false);
let pz: PanzoomObject | null = null;

function initZoom() {
  pz?.destroy();
  if (!imageRef.value) return;

  pz = Panzoom(imageRef.value, {
    cursor: "",
    disablePan: true,
    maxScale: 4,
    overflow: "visible",
    step: 0.03,
    touchAction: "none",
  });

  imageRef.value.addEventListener("panzoomchange", (e) => {
    isZoomed.value = (e as CustomEvent).detail.scale > 1;
  });
}

function onImageClick() {
  if (!pz) return;
  isZoomed.value ? pz.reset({ animate: true }) : pz.zoom(2, { animate: true });
}

function onWheel(e: WheelEvent) {
  if (!pz) return;
  e.preventDefault();
  e.deltaY < 0 ? pz.zoomIn({ animate: false }) : pz.zoomOut({ animate: false });
}

watch(imageRef, (el) => {
  if (el) initZoom();
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      pz?.reset({ animate: false });
      isZoomed.value = false;
    }
  }
);

onUnmounted(() => {
  pz?.destroy();
  pz = null;
});
</script>
