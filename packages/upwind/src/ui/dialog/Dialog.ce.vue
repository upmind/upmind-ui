<template>
  <link rel="stylesheet" :href="stylesheet" />

  <dialog-root :open="open" @update:open="onOpen">
    <dialog-trigger>
      <slot name="trigger" />
    </dialog-trigger>
    <dialog-overlay :class="styles.dialog.overlay">
      <dialog-content :class="styles.dialog.content">
        <div ref="target">
          <div
            v-if="title || $slots.title || description || $slots.description"
          >
            <dialog-title
              v-if="title || $slots.title"
              :class="styles.dialog.title"
            >
              <slot name="title">{{ title }}</slot>
            </dialog-title>

            <dialog-description
              v-if="description || $slots.description"
              :class="styles.dialog.description"
            >
              <slot name="description">{{ description }}</slot>
            </dialog-description>
          </div>

          <slot />

          <div :class="styles.dialog.footer">
            <slot name="footer">
              <dialog-close @click="forceClose">
                <slot name="close" />
              </dialog-close>
            </slot>
          </div>
        </div>
      </dialog-content>
    </dialog-overlay>
  </dialog-root>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs, ref } from "vue";
import {
  DialogRoot,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "radix-vue";

// --- internal

import { useStyles, stylesheet } from "../../utils";
import config from "./dialog.config";

// --- types
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
    DialogTitle,
    DialogTrigger,
  },
  emits: ["update:modelValue", "input"],
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
    modelValue: { type: Boolean },
    persistent: { type: Boolean },
    fit: { type: String as PropType<DialogConfig["fit"]>, default: "contain" },
    skrim: { type: String as PropType<DialogConfig["skrim"]>, default: "dark" },
  },
  setup(props, { emit }) {
    const styles = useStyles(
      "dialog",
      toRefs(props),
      config,
      props.upwindConfig
    );

    const open = ref(props.modelValue);

    return {
      stylesheet,
      styles,
      open,
    };
  },
  methods: {
    onOpen(value: boolean, force: boolean = false) {
      if (this.persistent && !value && !force) return;
      this.open = value;
      this.$emit("update:modelValue", value);
      this.$emit("input", { isOpen: value });
    },
    forceClose() {
      this.onOpen(false, true);
    },
  },
  watch: {
    modelValue(value, oldValue) {
      if (value === oldValue) return;
      this.open = value;
    },
  },
});
</script>
