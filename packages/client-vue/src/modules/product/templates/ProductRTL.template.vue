<template>
  <Layout>
    <template #content-header>
      <slot name="product-details" />
      <slot name="markdown" />
    </template>

    <template #content>
      <slot name="configuration" />
    </template>

    <template #aside>
      <slot name="pricing" />
    </template>

    <template #footer>
      <slot name="terms" />
    </template>

    <template #content-footer>
      <slot name="actions" />
    </template>

    <template #aside-footer>
      <slot name="total" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- internal
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { useLayout } from "../../../components/layout/useLayout";
import { useRoutingEngine } from "@upmind-automation/headless";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_BACKGROUND } from "../../../components/header/types";
defineOptions({
  inheritAttrs: false
});

const { isResolved } = useRoutingEngine();

onMounted(async () => {
  await isResolved();
  useHeader({
    background: HEADER_BACKGROUND.RTL,
    border: "none",
    items: "end"
  });

  useLayout({
    variant: LAYOUT_VARIANTS.TWO_COLUMN_RTL
  });

  useFooter({});
});
</script>
