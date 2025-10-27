<template>
  <component :is="layoutComponent" v-bind="props">
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
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import DefaultLayout from "./layouts/Default.layout.vue";
import EnclosedLayout from "./layouts/Enclosed.layout.vue";
import FullLayout from "./layouts/Full.layout.vue";
import TwoColumnLTRLayout from "./layouts/TwoColumnLTR.layout.vue";
import TwoColumnRTLLayout from "./layouts/TwoColumnRTL.layout.vue";
import SplitLayout from "./layouts/Split.layout.vue";
import CanvasCardLayout from "./layouts/CanvasCard.layout.vue";
import SurfaceBoxLayout from "./layouts/SurfaceBox.layout.vue";

// --- types
import type { LayoutProps } from "./types";
import { LAYOUT_VARIANTS } from "./types";

const props = withDefaults(defineProps<LayoutProps>(), {
  overflow: "visible",
  sticky: true
});

const layoutComponent = computed(() => {
  switch (props.variant) {
    case LAYOUT_VARIANTS.DEFAULT:
      return DefaultLayout;

    case LAYOUT_VARIANTS.ENCLOSED:
      return EnclosedLayout;

    case LAYOUT_VARIANTS.TWO_COLUMN_LTR:
      return TwoColumnLTRLayout;

    case LAYOUT_VARIANTS.TWO_COLUMN_RTL:
      return TwoColumnRTLLayout;

    case LAYOUT_VARIANTS.SPLIT:
      return SplitLayout;

    case LAYOUT_VARIANTS.CANVAS_CARD:
      return CanvasCardLayout;

    case LAYOUT_VARIANTS.SURFACE_BOX:
      return SurfaceBoxLayout;

    case LAYOUT_VARIANTS.FULL:
    default:
      return FullLayout;
  }
});
</script>
