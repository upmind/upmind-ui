<template>
  <Layout>
    <template #content-header>
      <slot name="summary" />
    </template>

    <template #content>
      <slot name="content" />
    </template>

    <template #aside>
      <slot name="pricing" />
      <slot name="errors" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- internal
import { useLayout } from "../../../components/layout/useLayout";
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";
import { useSection } from "../../../components/section/useSection";
import { useRoutingEngine } from "@upmind-automation/headless";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- types
import { HEADER_BACKGROUND } from "../../../components/header/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

defineOptions({
  inheritAttrs: false
});

const { isResolved } = useRoutingEngine();

onMounted(async () => {
  await isResolved();
  useHeader({
    background: HEADER_BACKGROUND.SURFACE,
    border: "none",
    items: "end"
  });

  useLayout({
    variant: LAYOUT_VARIANTS.SPLIT_VERTICAL
  });

  useSection({
    card: true,
    border: false
  });

  useFooter({});
});
</script>
