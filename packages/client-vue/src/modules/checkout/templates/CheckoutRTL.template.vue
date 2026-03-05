<template>
  <Layout>
    <template #navigation>
      <slot name="back" />
    </template>

    <template #content-header>
      <slot name="summary" />
    </template>

    <template #content>
      <slot v-if="isMobile" name="pricing" />
      <slot name="content" />
    </template>

    <template #aside>
      <slot v-if="!isMobile" name="pricing" />
      <slot name="markdown" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- internal
import { useLayout } from "../../../components/layout/useLayout";
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";

// --- types
import { HEADER_BACKGROUND } from "../../../components/header/types";
import {
  FOOTER_LAYOUT,
  FOOTER_BACKGROUND
} from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

defineOptions({
  inheritAttrs: false
});

useLayout({
  variant: LAYOUT_VARIANTS.TWO_COLUMN_RTL
});

onMounted(() => {
  useHeader({
    background: HEADER_BACKGROUND.RTL,
    border: "none",
    items: "end"
  });

  useFooter({
    layout: FOOTER_LAYOUT.FLAT,
    background: FOOTER_BACKGROUND.RTL,
    items: "end",
    justifyLeft: "start",
    justifyRight: "between",
    reverse: true
  });
});
</script>
