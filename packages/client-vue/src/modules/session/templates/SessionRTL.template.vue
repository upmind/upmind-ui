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
// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";
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

// --- methods
useHeader({
  background: HEADER_BACKGROUND.RTL,
  border: "none",
  items: "end"
});

useLayout({
  variant: LAYOUT_VARIANTS.TWO_COLUMN_RTL
});

useFooter({
  layout: FOOTER_LAYOUT.FLAT,
  background: FOOTER_BACKGROUND.RTL,
  items: "end",
  justifyLeft: "start",
  justifyRight: "between",
  reverse: true,
  noCurrency: true
});
</script>
