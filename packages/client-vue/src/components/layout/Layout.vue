<template>
  <component :is="layoutComponent" v-bind="props">
    <template #header-left>
      <slot name="header-left" />
    </template>

    <template #header-right>
      <slot name="header-right" />
    </template>

    <template #controls>
      <slot name="controls" />
    </template>

    <template #navigation>
      <slot name="navigation" />
    </template>

    <template #actions>
      <slot name="actions" />
    </template>

    <template #content-header>
      <slot name="content-header" />
    </template>

    <template #content>
      <slot name="content" />
      <slot name="default" />
    </template>

    <template #aside>
      <slot name="aside" />
    </template>

    <template #aside-footer>
      <slot name="aside-footer" />
    </template>

    <template #footer-content>
      <slot name="footer-content" />
    </template>

    <template #footer-actions>
      <slot name="footer-actions" />
    </template>

    <template #footer-copyright>
      <slot name="footer-copyright" />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import DefaultLayout from "./components/DefaultLayout.vue";
import EnclosedLayout from "./components/EnclosedLayout.vue";
import FullLayout from "./components/FullLayout.vue";
import TwoColumnLTRLayout from "./components/TwoColumnLTRLayout.vue";
import TwoColumnRTLLayout from "./components/TwoColumnRTLLayout.vue";
import SplitLayout from "./components/SplitLayout.vue";
import CanvasCardLayout from "./components/CanvasCardLayout.vue";
import SurfaceBoxLayout from "./components/SurfaceBoxLayout.vue";

// --- types
import type { LayoutProps } from "./types";

const props = withDefaults(defineProps<LayoutProps>(), {
  overflow: "visible",
  sticky: true
});

const layoutComponent = computed(() => {
  switch (props.variant) {
    case "default":
      return DefaultLayout;

    case "enclosed":
      return EnclosedLayout;

    case "two-column-LTR":
      return TwoColumnLTRLayout;

    case "two-column-RTL":
      return TwoColumnRTLLayout;

    case "split":
      return SplitLayout;

    case "canvas-card":
      return CanvasCardLayout;

    case "surface-box":
      return SurfaceBoxLayout;

    case "full":
    default:
      return FullLayout;
  }
});
</script>
