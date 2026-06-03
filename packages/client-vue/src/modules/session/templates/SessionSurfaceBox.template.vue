<template>
  <Layout :variant="LAYOUT_VARIANTS.SURFACE_BOX">
    <template #content-header>
      <slot name="hero" />
      <slot name="guest" />
    </template>

    <template #content>
      <slot name="markdown" />
      <slot name="form" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import type { SessionRoutes } from "../types";
import {
  FOOTER_LAYOUT,
  FOOTER_BACKGROUND
} from "../../../components/footer/types";

// -----------------------------------------------------------------------------

const props = defineProps<SessionRoutes>();

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

onMounted(() => {
  useHeader({
    visible: true
  });

  useFooter({
    visible: true,
    layout: FOOTER_LAYOUT.STACKED,
    background: FOOTER_BACKGROUND.SURFACE
  });
});
</script>
