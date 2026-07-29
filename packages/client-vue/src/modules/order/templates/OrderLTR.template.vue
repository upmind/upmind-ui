<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR">
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
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { useSection } from "../../../components/section/useSection";
import { useFooter } from "../../../components/footer/useFooter";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import { FOOTER_BACKGROUND } from "../../../components/footer/types";
import { FOOTER_LAYOUT } from "../../../components/footer/types";

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

const { ui } = useConfig();

onMounted(() => {
  useHeader({
    noBasket: ui.basketAction.isHidden,
    background: HEADER_BACKGROUND.LTR,
    border: "none",
    items: "end"
  });

  // plain sections (defaults); clears a carded environment left by an
  // enclosed or inset page
  useSection({});

  useFooter({
    layout: FOOTER_LAYOUT.FLAT,
    background: FOOTER_BACKGROUND.LTR,
    items: "end",
    justifyRight: "start",
    noCurrency: true
  });
});
</script>
