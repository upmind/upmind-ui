<template>
  <component :is="layoutComponent" v-bind="config">
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

    <template #tabs>
      <slot name="tabs" />
    </template>

    <template #content>
      <slot name="content" />
      <slot name="default" />
    </template>

    <template #aside-header>
      <slot name="aside-header" />
    </template>

    <template #aside>
      <slot name="aside" />
    </template>

    <template #content-footer>
      <slot name="content-footer" />
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
import { useLayout } from "./useLayout";

// --- components
import FullLayout from "./layouts/Full.layout.vue";
import TwoColumnLTRLayout from "./layouts/TwoColumnLTR.layout.vue";
import TwoColumnRTLLayout from "./layouts/TwoColumnRTL.layout.vue";
import SplitVerticalLayout from "./layouts/SplitVertical.layout.vue";
import SplitHorizontalLayout from "./layouts/SplitHorizontal.layout.vue";
import CanvasCardLayout from "./layouts/CanvasCard.layout.vue";
import SurfaceBoxLayout from "./layouts/SurfaceBox.layout.vue";

// --- types
import type { LayoutProps } from "./types";
import { LAYOUT_VARIANTS, LAYOUT_OVERFLOW, LAYOUT_MODE } from "./types";

const props = defineProps<LayoutProps>();

const layoutConfig = useLayout();

const config = computed(() => ({
  overflow:
    props.overflow ?? layoutConfig.overflow.value ?? LAYOUT_OVERFLOW.VISIBLE,
  mode: props.mode ?? layoutConfig.mode.value,
  minimal: props.minimal ?? layoutConfig.minimal.value ?? false,
  class: props.class
}));

const layoutComponent = computed(() => {
  const layout = props.variant ?? layoutConfig.variant.value;

  switch (layout) {
    case LAYOUT_VARIANTS.TWO_COLUMN_LTR:
      return TwoColumnLTRLayout;

    case LAYOUT_VARIANTS.TWO_COLUMN_RTL:
      return TwoColumnRTLLayout;

    case LAYOUT_VARIANTS.SPLIT_VERTICAL:
      return SplitVerticalLayout;

    case LAYOUT_VARIANTS.SPLIT_HORIZONTAL:
      return SplitHorizontalLayout;

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
