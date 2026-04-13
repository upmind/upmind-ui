<template>
  <Layout>
    <template #navigation>
      <slot name="back" />
    </template>

    <template #content-header>
      <slot name="hero" />
    </template>

    <template #content>
      <slot name="content" />
    </template>

    <template #aside>
      <slot name="markdown" />
    </template>

    <template #content-footer>
      <slot name="content-footer" />
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

// --- types
import { HEADER_BACKGROUND } from "../../../components/header/types";
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
    visible: false
  });
});
</script>
