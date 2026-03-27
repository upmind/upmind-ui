<template>
  <DialogRoot :open="props.open" @update:open="emits('update:open', $event)">
    <DialogPortal>
      <DialogContent
        class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fill-mode-both animation-duration-200 bg-overlay fixed inset-0 z-50 flex touch-none items-center justify-center overflow-hidden p-4 outline-none"
        @touchstart="onTouchStart"
        @wheel="onWheel"
        @click.self="emits('update:open', false)"
      >
        <img
          v-if="props.image?.url"
          ref="imageRef"
          :src="props.image.previewUrl ?? props.image.url"
          :alt="props.image.alt"
          class="image-radius max-h-[90vh] max-w-[90vw] object-contain select-none"
          :style="zoomStyle"
          @click="onImageClick"
          draggable="false"
        />

        <DialogClose
          class="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <Icon icon="x-close" size="md" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import {
  DialogRoot,
  DialogPortal,
  DialogContent,
  DialogClose
} from "radix-vue";
import { Icon } from "../icon";
import { useImageZoom } from "../../utils";
import type { ImagePreviewProps } from "./types";

const props = defineProps<ImagePreviewProps>();
const emits = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const imageRef = ref<HTMLImageElement | null>(null);
const { zoomStyle, onImageClick, onWheel, onTouchStart, reset } =
  useImageZoom(imageRef);

// Reset zoom when dialog closes
watch(
  () => props.open,
  open => {
    if (!open) reset();
  }
);
</script>
