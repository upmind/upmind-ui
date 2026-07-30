<template>
  <Layout :variant="LAYOUT_VARIANTS.SURFACE_BOX">
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
import { onMounted } from "vue";
import Layout from "../../../components/layout/Layout.vue";
import { useFooter } from "../../../components/footer/useFooter";
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { useSection } from "../../../components/section/useSection";
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

const { ui } = useConfig();

onMounted(() => {
  useHeader({
    noBasket: ui.basketAction.isHidden,
    visible: true
  });

  // plain sections (defaults); clears a carded environment left by an
  // enclosed or inset page
  useSection({});

  useFooter({
    visible: true,
    layout: FOOTER_LAYOUT.STACKED,
    background: FOOTER_BACKGROUND.SURFACE
  });
});
</script>
