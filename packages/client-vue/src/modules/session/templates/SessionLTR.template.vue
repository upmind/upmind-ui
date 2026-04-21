<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR">
    <template #content-header>
      <slot name="hero" />
    </template>

    <template #content>
      <slot name="form" />
    </template>

    <template #aside>
      <slot name="summary" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onUnmounted, onBeforeMount } from "vue";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- internal
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { useLayout } from "../../../components/layout/useLayout";

// --- types
import { HEADER_BACKGROUND } from "../../../components/header/types";
import {
  FOOTER_LAYOUT,
  FOOTER_BACKGROUND
} from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import type { SessionRoutes } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<SessionRoutes>();

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

onBeforeMount(() => {
  useHeader({
    background: HEADER_BACKGROUND.LTR,
    border: "none",
    items: "end"
  });

  useFooter({
    layout: FOOTER_LAYOUT.FLAT,
    background: FOOTER_BACKGROUND.LTR,
    items: "end",
    justifyRight: "start",
    noCurrency: true
  });
});

onUnmounted(() => {
  useHeader({});
  useLayout({});
  useFooter({});
});
</script>
