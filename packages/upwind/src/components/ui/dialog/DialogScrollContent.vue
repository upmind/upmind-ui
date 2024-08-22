<template>
  <DialogPortal>
    <DialogOverlay :class="styles.dialog.overlay">
      <DialogContent
        :class="styles.dialog.content"
        @pointer-down-outside="handlePointerDownOutside"
      >
        <slot />

        <DialogClose :class="styles.dialog.close">
          <UpwIcon icon="close" :class="styles.dialog.closeIcon" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </DialogOverlay>
  </DialogPortal>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from "radix-vue";

// --- internal
import config from "./dialog.config";

// --- components
import UpwIcon from "../../icon/Icon.vue";

// --- utils
import { useStyles } from "../../../utils";

// --- types
import type { DialogConfig } from "./index";
import type { PropType } from "vue";

export default defineComponent({
  components: {
    DialogClose,
    DialogContent,
    DialogOverlay,
    DialogPortal,
    UpwIcon,
  },
  props: {
    size: {
      type: String as PropType<DialogConfig["size"]>,
      default: "lg",
    },
    overflow: {
      type: String as PropType<DialogConfig["overflow"]>,
      default: "visible",
    },
  },

  emits: [
    "update:open",
    "openChange",
    "escapeKeyDown",
    "pointerDownOutside",
    "interactOutside",
    "close",
  ],
  setup(props) {
    const styles = useStyles("dialog", toRefs(props), config);

    const handlePointerDownOutside = (event: PointerEvent) => {
      const originalEvent = event as unknown as {
        detail: { originalEvent: PointerEvent };
      };
      const target = originalEvent.detail.originalEvent.target as HTMLElement;
      if (
        originalEvent.detail.originalEvent.offsetX > target.clientWidth ||
        originalEvent.detail.originalEvent.offsetY > target.clientHeight
      ) {
        event.preventDefault();
      }
    };

    return {
      handlePointerDownOutside,
      styles,
    };
  },
});
</script>
