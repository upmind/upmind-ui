<template>
  <Layout>
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
import { onMounted, onUnmounted, watch } from "vue";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- internal
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { useLayout } from "../../../components/layout/useLayout";
import { useRoutingEngine } from "@upmind-automation/headless";

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

const { isResolved } = useRoutingEngine();

onMounted(async () => {
  await isResolved();
  useHeader({
    background: HEADER_BACKGROUND.LTR,
    border: "none",
    items: "end"
  });

  useLayout({
    variant: LAYOUT_VARIANTS.TWO_COLUMN_LTR
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
