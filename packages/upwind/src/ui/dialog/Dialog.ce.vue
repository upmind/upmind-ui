<template>
  <dialog-root>
    <dialog-trigger>
      <slot name="trigger" />
    </dialog-trigger>
    <dialog-scroll-content :size="size" :overflow="overflow">
      <dialog-header v-if="title || description">
        <dialog-title v-if="title">{{ title }}</dialog-title>
        <dialog-description v-if="description">
          {{ description }}
        </dialog-description>
      </dialog-header>

      <slot name="content" />
      <slot />

      <dialog-footer v-if="$slots.footer">
        <slot name="footer" />
      </dialog-footer>
    </dialog-scroll-content>
  </dialog-root>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- internal
import config from "./dialog.config";

// --- components
import {
  Dialog as DialogRoot,
  DialogScrollContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from ".";

// --- utils
import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
import type { DialogConfig } from "./types";

export default defineComponent({
  components: {
    DialogRoot,
    DialogScrollContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

  setup(props) {
    const styles = useStyles(
      "dialog",
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      props,
      styles,
    };
  },
});
</script>
