<template>
  <Layout>
    <template #content-header>
      <slot name="hero" />
    </template>

    <template #content>
      <slot name="form" />
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
import { FOOTER_LAYOUT } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { LAYOUT_MODE } from "../../../components/layout/types";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import type { SessionRoutes } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<SessionRoutes>();

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

// --- methods
useHeader({
  visible: false
});

useLayout({
  variant: LAYOUT_VARIANTS.CANVAS_CARD,
  mode: LAYOUT_MODE.CENTERED
});

useFooter({
  visible: false
});
</script>
