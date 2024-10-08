<template>
  <Drawer v-bind="forwarded" v-model:open="value">
    <DrawerTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DrawerTrigger>

    <DrawerContent
      v-bind="forwarded"
      :class="cn(variants.drawer.content, props.class)"
      :classOverlay="variants.drawer.overlay"
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
        <div :class="cn(variants.drawer.container, props.classHeader)">
          <slot name="header">
            <DrawerTitle v-if="title || $slots.title" v-bind="forwarded">
              <slot name="title">{{ title }}</slot>
            </DrawerTitle>
            <DrawerDescription
              v-if="description || $slots.description"
              v-bind="forwarded"
            >
              <slot name="description">{{ description }}</slot>
            </DrawerDescription>
          </slot>
        </div>
      </DrawerHeader>

      <div
        :class="
          cn(
            variants.drawer.inner,
            variants.drawer.container,
            props.classContent
          )
        "
      >
        <slot />
      </div>

      <DrawerFooter
        :class="
          cn(
            'flex flex-col gap-2',
            variants.drawer.container,
            props.classFooter
          )
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

<script setup lang="ts">
// --- external
import { computed } from "vue";
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

const props = withDefaults(defineProps<DrawerProps>(), {
  // --- props
  open: false,
  title: "",
  description: "",
  // --- variants
  size: "app",
  overflow: "auto",
  fit: "contain",
  skrim: "dark",
  // --- styles
  upwindConfig: () => ({
    drawer: {
      container: {},
      overlay: {},
      content: {},
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
const forwarded = useForwardPropsEmits(props, emits);

const meta = computed(() => ({
  size: props.size,
  overflow: props.overflow,
  fit: props.fit,
  skrim: props.skrim,
}));

const variants = useStyles(
  ["drawer"],
  meta,
  config,
  props.upwindConfig ?? {}
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
</script>
