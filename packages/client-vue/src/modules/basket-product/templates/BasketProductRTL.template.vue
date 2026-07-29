<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL">
    <template #content-header>
      <slot name="product-details" />
      <slot name="markdown" />
    </template>

    <template #content>
      <slot name="configuration" />
    </template>

    <template #aside>
      <slot name="errors" />
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
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { useSection } from "../../../components/section/useSection";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_BACKGROUND } from "../../../components/header/types";

defineOptions({
  inheritAttrs: false
});

const { ui } = useConfig();

onMounted(() => {
  useHeader({
    noBasket: ui.basketAction.isHidden,
    background: HEADER_BACKGROUND.RTL,
    border: "none",
    items: "end"
  });

  // plain sections (defaults); clears a carded environment left by an
  // enclosed or inset page
  useSection({});

  useFooter({});
});
</script>
