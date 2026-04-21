<template>
  <Layout :variant="LAYOUT_VARIANTS.CANVAS_CARD" :mode="LAYOUT_MODE.CENTERED">
    <template #content-header>
      <slot name="hero" />
      <slot name="markdown" />
    </template>

    <template #content>
      <slot name="form" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onBeforeMount, onUnmounted } from "vue";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";
import { useLayout } from "../../../components/layout/useLayout";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { LAYOUT_MODE } from "../../../components/layout/types";
import type { SessionRoutes } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<SessionRoutes>();

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

onBeforeMount(() => {
  useHeader({
    visible: false
  });

  useFooter({
    visible: false
  });
});

onUnmounted(() => {
  useHeader({});
  useLayout({});
  useFooter({});
});
</script>
