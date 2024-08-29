<template>
  <dialog-root @update:open="$emit('update:open', $event)">
    <dialog-trigger>
      <slot name="trigger" />
    </dialog-trigger>
    <dialog-portal>
      <dialog-overlay :class="styles.dialog.overlay">
        <dialog-content
          :class="styles.dialog.content"
          @pointer-down-outside="handlePointerDownOutside"
        >
          <dialog-header v-if="title || description">
            <dialog-title v-if="title" :class="styles.dialog.title">{{
              title
            }}</dialog-title>
            <dialog-description
              v-if="description"
              :class="styles.dialog.description"
            >
              {{ description }}
            </dialog-description>
          </dialog-header>

          <slot name="content" />
          <slot />

          <dialog-footer v-if="$slots.footer" :class="styles.dialog.footer">
            <slot name="footer" />
          </dialog-footer>

          <dialog-close :class="styles.dialog.close">
            <upw-icon icon="close" :class="styles.dialog.closeIcon" />
            <span class="sr-only">Close</span>
          </dialog-close>
        </dialog-content>
      </dialog-overlay>
    </dialog-portal>
  </dialog-root>
</template>

<script lang="ts">
import { defineComponent, toRefs } from "vue";
import {
  DialogRoot,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "radix-vue";
import config from "./dialog.config";
import UpwIcon from "../../components/icon/Icon.vue";
import { useStyles } from "../../utils";
import type { PropType } from "vue";
import type { DialogConfig } from "./types";

export default defineComponent({
  name: "UwDialog",
  components: {
    DialogRoot,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
    UpwIcon,
  },
  props: {
    title: { type: String },
    description: { type: String },
    size: {
      type: String as PropType<DialogConfig["size"]>,
      default: "lg",
    },
    overflow: {
      type: String as PropType<DialogConfig["overflow"]>,
      default: "visible",
    },
    upwindConfig: { type: Object, default: () => ({}) },
  },
  emits: ["update:open"],
  setup(props) {
    const styles = useStyles(
      "dialog",
      toRefs(props),
      config,
      props.upwindConfig
    );

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
      styles,
      handlePointerDownOutside,
    };
  },
});
</script>

<style src="@/assets/main.css" />
