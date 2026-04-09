<template>
  <Layout>
    <template #content-header>
      <slot name="hero" />
    </template>

    <template #content>
      <slot name="markdown" />
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
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { useLayout } from "../../../components/layout/useLayout";
// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import type { SessionRoutes } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<SessionRoutes>();

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

useLayout({
  variant: LAYOUT_VARIANTS.SPLIT_HORIZONTAL
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
