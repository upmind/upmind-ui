<template>
  <Layout :variant="LAYOUT_VARIANTS.SPLIT_HORIZONTAL">
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
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { useSection } from "../../../components/section/useSection";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import type { SessionRoutes } from "../types";

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
    visible: false
  });

  // plain sections (defaults); clears a carded environment left by an
  // enclosed or inset page
  useSection({});

  useFooter({
    visible: false
  });
});
</script>
