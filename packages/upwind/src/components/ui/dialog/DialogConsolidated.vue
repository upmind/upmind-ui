<template>
  <Dialog>
    <dialog-trigger>
      <slot name="trigger" />
    </dialog-trigger>
    <dialog-scroll-content :size="size" :overflow="overflow">
      <dialog-header v-if="hasHeader">
        <dialog-title v-if="hasTitle">{{ title }}</dialog-title>
        <dialog-description v-if="hasDescription">
          {{ description }}
        </dialog-description>
      </dialog-header>

      <slot name="content" />
      <slot />

      <dialog-footer v-if="$slots.footer">
        <slot name="footer" />
      </dialog-footer>
    </dialog-scroll-content>
  </Dialog>
</template>

<script lang="ts">
// --- external
import { computed, toRefs } from "vue";
import { isEmpty } from "lodash-es";

// --- internal
import config from "./dialog.config";

// --- components
import {
  Dialog,
  DialogScrollContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from ".";

// --- utils
import { useStyles } from "../../../utils";

// --- types
import type { DialogConfig } from "./index";
import type { PropType } from "vue";

export default {
  components: {
    Dialog,
    DialogScrollContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  },

  props: {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    size: {
      type: String as PropType<DialogConfig["size"]>,
      default: "lg",
    },
    overflow: {
      type: String as PropType<DialogConfig["overflow"]>,
      default: "visible",
    },
    upwindConfig: {
      type: Object,
      default: null,
    },
  },

  setup(props) {
    const styles = useStyles(
      "dialog",
      toRefs(props),
      config,
      props.upwindConfig
    );

    const hasTitle = computed(() => {
      return !isEmpty(props.title);
    });
    const hasDescription = computed(() => {
      return !isEmpty(props.description);
    });
    const hasHeader = computed(() => {
      return hasTitle.value || hasDescription.value;
    });

    return {
      props,
      styles,
      hasTitle,
      hasDescription,
      hasHeader,
    };
  },
};
</script>
