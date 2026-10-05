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
import { useFooter } from "../../../components/footer/useFooter";
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { Layout } from "@upmind-automation/foundation";
import { useSection } from "@upmind-automation/foundation";
import { LAYOUT_VARIANTS } from "@upmind-automation/foundation";
import type { AuthRoutes } from "@upmind-automation/auth";
import {
  FOOTER_LAYOUT,
  FOOTER_BACKGROUND
} from "../../../components/footer/types";

// -----------------------------------------------------------------------------

const props = defineProps<AuthRoutes>();

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
