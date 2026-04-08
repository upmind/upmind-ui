<template>
  <Layout>
    <template #content-header>
      <slot name="summary" />
    </template>

    <template #content>
      <slot name="products" />
    </template>

    <template #aside>
      <slot v-if="isMobile" name="errors" />
      <slot name="pricing" />
      <slot v-if="!isMobile" name="errors" />
      <slot name="custom-price" />
      <slot name="markdown" />
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
// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";

// --- types
import { HEADER_BACKGROUND } from "../../../components/header/types";
import {
  FOOTER_BACKGROUND,
  FOOTER_LAYOUT
} from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

defineOptions({
  inheritAttrs: false
});

useLayout({
  variant: LAYOUT_VARIANTS.TWO_COLUMN_LTR
});

onMounted(() => {
  useHeader({
    background: HEADER_BACKGROUND.LTR,
    border: "none",
    items: "end"
  });

  useFooter({
    layout: FOOTER_LAYOUT.FLAT,
    background: FOOTER_BACKGROUND.LTR,
    items: "end",
    justifyRight: "start"
  });
});
</script>
