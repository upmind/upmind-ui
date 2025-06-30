<template>
  <Drawer v-bind="forwardedDrawer" v-model:open="value">
    <DrawerTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DrawerTrigger>

    <DrawerContent
      v-bind="forwardedDrawerContent"
      :class="cn(styles.drawer.content, props.class)"
      :classOverlay="styles.drawer.overlay"
    >
      <DrawerHeader
        v-if="
          $slots.header ||
          title ||
          $slots.title ||
          description ||
          $slots.description
        "
      >
        <div :class="cn(styles.drawer.container, props.classHeader)">
          <slot name="header">
            <DrawerTitle v-if="title || $slots.title">
              <slot name="title">{{ title }}</slot>
            </DrawerTitle>
            <DrawerDescription v-if="description || $slots.description">
              <slot name="description">{{ description }}</slot>
            </DrawerDescription>
          </slot>
        </div>
      </DrawerHeader>

      <div :class="cn(styles.drawer.inner)">
        <div :class="cn('py-1', styles.drawer.container, props.classContent)">
          <slot></slot>
        </div>
      </div>

      <DrawerFooter
        :class="
          cn('flex flex-col gap-2', styles.drawer.container, props.classFooter)
        "
      >
        <slot name="footer" />

        <DrawerClose v-if="$slots.close">
          <slot name="close" />
        </DrawerClose>

        <slot name="actions" />
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

<script lang="ts" setup>
// --- external
import { computed, watch } from "vue";
import { useForwardPropsEmits } from "radix-vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { useStyles, cn } from "../../utils";
import config from "./drawer.config";

// --- components
import Drawer from "./Drawer.vue";
import DrawerContent from "./DrawerContent.vue";
import DrawerDescription from "./DrawerDescription.vue";
import DrawerFooter from "./DrawerFooter.vue";
import DrawerHeader from "./DrawerHeader.vue";
import DrawerTitle from "./DrawerTitle.vue";
import { DrawerTrigger, DrawerClose } from "vaul-vue";

// --- types
import type { ComputedRef } from "vue";
import type { DrawerProps } from "./types";

// --- utils
import { pick } from "lodash-es";
import { usePointerEvents } from "../../utils/usePointerEvents";

const props = withDefaults(defineProps<DrawerProps>(), {
  // --- props
  title: "",
  description: "",
  // --- styles
  size: "md",
  width: "app",
  overflow: "auto",
  fit: "contain",
  skrim: "dark",
  to: "body",
  // --- state
  dismissible: true,
  // --- styles
  uiConfig: () => ({
    drawer: {
      container: [],
      overlay: [],
      content: [],
      inner: [],
      header: [],
      footer: []
    }
  }),
  class: "",
  classHeader: "",
  classContent: "",
  classFooter: ""
});

const emits = defineEmits<{
  (e: "close"): void;
  (e: "update:open", open: boolean): void;
  (e: "update:activeSnapPoint", val: string | number): void;
}>();

const forwardedDrawer = useForwardPropsEmits(
  pick(props, [
    "activeSnapPoint",
    "closeThreshold",
    "shouldScaleBackground",
    "scrollLockTimeout",
    "fixed",
    "dismissible",
    "modal",
    "open",
    "defaultOpen",
    "nested",
    "direction"
  ]),
  emits
);
const forwardedDrawerContent = useForwardPropsEmits(
  pick(props, ["to", "disabled", "forceMount"]),
  emits
);

const value = useVModel(props, "open", emits);

const meta = computed(() => ({
  width: props.width,
  overflow: props.overflow,
  fit: props.fit,
  skrim: props.skrim
}));

const styles = useStyles(
  ["drawer"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  drawer: {
    overlay: string;
    container: string;
    content: string;
    inner: string;
    header: string;
    footer: string;
  };
}>;
</script>
