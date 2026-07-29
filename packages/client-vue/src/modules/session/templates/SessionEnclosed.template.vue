<template>
  <Layout :variant="LAYOUT_VARIANTS.SPLIT_VERTICAL">
    <template #content-header>
      <slot name="hero" />
    </template>

    <template #content>
      <slot name="guest" />
      <slot name="form" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { useSection } from "../../../components/section/useSection";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import {
  FOOTER_LAYOUT,
  FOOTER_BACKGROUND
} from "../../../components/footer/types";

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

const { ui } = useConfig();

onMounted(() => {
  useHeader({
    noBasket: ui.basketAction.isHidden,
    background: HEADER_BACKGROUND.SURFACE,
    border: "none",
    items: "end"
  });

  useSection({
    card: true,
    border: false
  });

  useFooter({
    layout: FOOTER_LAYOUT.FLAT,
    background: FOOTER_BACKGROUND.CANVAS,
    items: "end",
    justifyLeft: "start",
    justifyRight: "between",
    reverse: true,
    noCurrency: true,
    noCopyright: true
  });
});
</script>
