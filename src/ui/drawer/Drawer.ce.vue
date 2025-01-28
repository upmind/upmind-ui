<template>
  <Drawer v-bind="forwardedDrawer" v-model:open="value">
    <DrawerTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DrawerTrigger>

    <DrawerContent
      v-bind="forwardedDrawerContent"
      :class="cn(styles.drawer.content, props.class)"
      :classOverlay="styles.drawer.overlay"
      @close="() => emits('update:open', false)"
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

      <div
        :class="
          cn(styles.drawer.inner, styles.drawer.container, props.classContent)
        "
      >
        <slot />
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
import type { DrawerRootEmits } from "vaul-vue";

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
  dismissible: false,
  // --- styles
  uiConfig: () => ({
    drawer: {
      container: {},
      overlay: {},
      content: [],
      inner: {},
      header: [],
      footer: [],
    },
  }),
  class: "",
  classHeader: "",
  classContent: "",
  classFooter: "",
});

const emits = defineEmits<DrawerRootEmits>();

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
    "direction",
  ]),
  emits
);
const forwardedDrawerContent = useForwardPropsEmits(
  pick(props, ["to", "disabled", "forceMount"]),
  emits
);

const meta = computed(() => ({
  width: props.width,
  overflow: props.overflow,
  fit: props.fit,
  skrim: props.skrim,
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

// --- state
const value = useVModel(props, "open", emits);

// By default, Drawer will set the Body element to pointer-events: none;
// This prevents the whole body from being clickable
// As this is a result of an external library that we can't override, we need to handle this manually
// With handlePointerEvents, pointer-events: none; is moved to props.to
const { handlePointerEvents } = usePointerEvents(value, props.to);

watch(value, newValue => {
  handlePointerEvents(newValue === true);
});
</script>
