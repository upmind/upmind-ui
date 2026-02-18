<template>
  <Drawer v-bind="forwardedDrawer" v-model:open="value">
    <DrawerTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DrawerTrigger>

    <DrawerContent
      v-bind="forwardedDrawerContent"
      :class="cn(styles.drawer.content, props.class)"
      :classOverlay="styles.drawer.overlay"
      @open-auto-focus="e => emits('openAutoFocus', e)"
      @close-auto-focus="e => emits('closeAutoFocus', e)"
    >
      <div
        class="drag-handle from-bg-button-subtle-0 to-bg-button-subtle-1 mx-auto mt-2 mb-8 min-h-2 w-[100px] rounded-full bg-gradient-to-r"
        data-testid="drawer-content"
        :data-vaul-no-drag="props.dismissible === false ? '' : undefined"
      ></div>

      <!-- Always render title for accessibility when using custom header -->
      <DrawerTitle v-if="$slots.header && title" class="sr-only">
        {{ title }}
      </DrawerTitle>
      <DrawerDescription v-if="$slots.header && description" class="sr-only">
        {{ description }}
      </DrawerDescription>

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

      <div v-if="$slots['default']" :class="cn(styles.drawer.inner)">
        <div :class="cn('py-1', styles.drawer.container, props.classContent)">
          <slot></slot>
        </div>
      </div>

      <DrawerFooter
        v-if="$slots.footer || $slots.close || $slots.actions"
        :class="cn(styles.drawer.footer.root)"
      >
        <div :class="styles.drawer.footer.container">
          <slot name="footer">
            <DrawerClose v-if="$slots.close">
              <slot name="close" />
            </DrawerClose>

            <slot name="actions" />
          </slot>
        </div>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

<script lang="ts" setup>
import { useVModel } from "@vueuse/core";
import { useForwardPropsEmits } from "radix-vue";
import { DrawerTrigger, DrawerClose } from "vaul-vue";
import { computed } from "vue";
import config from "./drawer.config";
import Drawer from "./Drawer.vue";
import DrawerContent from "./DrawerContent.vue";
import DrawerDescription from "./DrawerDescription.vue";
import DrawerFooter from "./DrawerFooter.vue";
import DrawerHeader from "./DrawerHeader.vue";
import DrawerTitle from "./DrawerTitle.vue";
import { useStyles, cn } from "../../utils";
import { pick } from "lodash-es";
import type { DrawerProps } from "./types";

const props = withDefaults(defineProps<DrawerProps>(), {
  // --- props
  title: "",
  description: "",
  // --- styles
  size: "md",
  width: "app",
  overflow: "auto",
  height: "auto",
  fit: "contain",
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
  (e: "openAutoFocus", event: Event): void;
  (e: "closeAutoFocus", event: Event): void;
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
  height: props.height
}));

const styles = useStyles(
  ["drawer", "drawer.footer"],
  meta,
  config,
  props.uiConfig ?? {}
);
</script>
