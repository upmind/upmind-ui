<template>
  <Layout>
    <template #content-header>
      <slot name="order-summary" />
    </template>

    <template #content>
      <slot name="order-payment-details" />
      <slot name="order-products" />
      <slot name="guest-registration" />
    </template>

    <template #aside>
      <slot name="order-details" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";
import { useLayout } from "../../../components/layout/useLayout";
import { useSection } from "../../../components/section/useSection";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_BACKGROUND } from "../../../components/header/types";

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

useLayout({
  variant: LAYOUT_VARIANTS.SPLIT_VERTICAL
});

onMounted(() => {
  useHeader({
    background: HEADER_BACKGROUND.SURFACE,
    border: "none",
    items: "end"
  });

  useSection({
    card: true,
    border: false
  });

  useFooter({
    noCurrency: true
  });
});
</script>
