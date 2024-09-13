<template>
  <drawer-root v-bind="$attrs">
    <drawer-trigger>
      <slot name="trigger" />
    </drawer-trigger>
    <drawer-portal>
      <drawer-overlay class="fixed inset-0 z-50 bg-black/80" />
      <drawer-content
        :class="'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background'"
      >
        <div class="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        <div class="mx-auto w-full" :class="maxWidth">
          <div class="grid gap-1.5 p-4 text-center sm:text-left">
            <drawer-title
              v-if="hasTitle"
              class="text-lg font-semibold leading-none tracking-tight"
            >
              {{ title }}
            </drawer-title>
            <drawer-description
              v-if="hasDescription"
              class="text-sm text-muted-foreground"
            >
              {{ description }}
            </drawer-description>
          </div>

          <slot />

          <div class="mt-auto flex flex-col gap-2 p-4">
            <slot name="footer" />

            <drawer-close>
              <slot name="close" />
            </drawer-close>
          </div>
        </div>
      </drawer-content>
    </drawer-portal>
  </drawer-root>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";

// --- components
import {
  DrawerRoot,
  DrawerContent,
  DrawerPortal,
  DrawerDescription,
  DrawerTitle,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
} from "vaul-vue";

// --- utils
import { isEmpty } from "lodash-es";

export default defineComponent({
  components: {
    DrawerRoot,
    DrawerContent,
    DrawerPortal,
    DrawerDescription,
    DrawerTitle,
    DrawerOverlay,
    DrawerTrigger,
    DrawerClose,
  },

  props: {
    title: { type: String },
    description: { type: String },
    maxWidth: { type: String, default: "max-w-sm" },
    upwindConfig: { type: Object, default: null },
    shouldScaleBackground: { type: Boolean, default: true },
    direction: { type: String },
    open: { type: Boolean },
    modal: { type: Boolean },
    nested: { type: Boolean },
    dismissible: { type: Boolean },
    snapPoints: { type: Array },
    activeSnapPoint: { type: [Number, null] },
    setActiveSnapPoint: { type: Function },
    fadeFromIndex: { type: Number },
    onOpenChange: { type: Function },
    onSnapPointChange: { type: Function },
  },

  setup(props) {
    const hasTitle = computed(() => !isEmpty(props.title));
    const hasDescription = computed(() => !isEmpty(props.description));

    return {
      hasTitle,
      hasDescription,
    };
  },
});
</script>
