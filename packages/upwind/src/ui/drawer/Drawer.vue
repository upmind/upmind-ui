<template>
  <drawer-root v-bind="$attrs">
    <drawer-trigger>
      <slot name="trigger" />
    </drawer-trigger>
    <drawer-portal>
      <drawer-overlay :class="styles.drawer.overlay" />
      <drawer-content :class="styles.drawer.content">
        <div :class="styles.drawer.handle" />
        <div :class="styles.drawer.container">
          <div :class="styles.drawer.header">
            <drawer-title v-if="hasTitle" :class="styles.drawer.title">
              {{ title }}
            </drawer-title>
            <drawer-description
              v-if="hasDescription"
              :class="styles.drawer.description"
            >
              {{ description }}
            </drawer-description>
          </div>

          <slot />

          <div :class="styles.drawer.footer">
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
import { defineComponent, computed, toRefs } from "vue";

// --- internal
import config from "./drawer.config";

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
import { useStyles } from "../../utils";
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
    maxWidth: { type: String, default: "md" },
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
    const styles = useStyles(
      "drawer",
      toRefs(props),
      config,
      props.upwindConfig
    );

    const hasTitle = computed(() => !isEmpty(props.title));
    const hasDescription = computed(() => !isEmpty(props.description));

    return {
      styles,
      hasTitle,
      hasDescription,
    };
  },
});
</script>
