<template>
  <dialog-root :open="controlledOpen" @update:open="handleOpenChange">
    <dialog-trigger>
      <slot name="trigger" />
    </dialog-trigger>
    <dialog-portal :disabled="true">
      <dialog-overlay :class="styles.dialog.overlay">
        <dialog-content
          :class="styles.dialog.content"
          @pointer-down-outside="handlePointerDownOutside"
        >
          <div v-if="title || description">
            <dialog-title v-if="title" :class="styles.dialog.title">{{
              title
            }}</dialog-title>
            <dialog-description
              v-if="description"
              :class="styles.dialog.description"
            >
              {{ description }}
            </dialog-description>
          </div>

          <slot name="content" />
          <slot />

          <div :class="styles.dialog.footer">
            <slot name="footer"></slot>

            <dialog-close>
              <slot name="close"></slot>
            </dialog-close>
          </div>
        </dialog-content>
      </dialog-overlay>
    </dialog-portal>
  </dialog-root>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref, watch } from "vue";
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
    open: {
      type: Boolean,
      default: undefined,
    },
  },
  emits: ["update:open"],
  setup(props, { emit }) {
    const internalOpen = ref(false);
    const controlledOpen = ref(props.open ?? false);

    watch(
      () => props.open,
      newValue => {
        if (newValue !== undefined) {
          controlledOpen.value = newValue;
        }
      }
    );

    const handleOpenChange = (isOpen: boolean) => {
      if (props.open === undefined) {
        controlledOpen.value = isOpen;
      }
      emit("update:open", isOpen);
    };

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
      controlledOpen,
      handleOpenChange,
    };
  },
});
</script>

<style src="@/assets/main.css" />
