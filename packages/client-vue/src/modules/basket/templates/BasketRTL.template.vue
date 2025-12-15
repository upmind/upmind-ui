<template>
  <Layout>
    <template #navigation>
      <slot name="back" />
    </template>

    <template #content-header>
      <slot name="summary" />
      <slot v-if="!isMobile" name="errors" />
    </template>

    <template #content>
      <slot name="products" />
      <slot v-if="isMobile" name="errors" />
      <slot v-if="isMobile" name="pricing" />
    </template>

    <template #aside>
      <slot v-if="!isMobile" name="pricing" />
    </template>

    <template #aside-footer>
      <slot name="total" />
    </template>

    <template #content-footer>
      <slot name="checkout" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";

// --- internal
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { useLayout } from "../../../components/layout/useLayout";
import { isMobile } from "@upmind-automation/upmind-ui";
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
