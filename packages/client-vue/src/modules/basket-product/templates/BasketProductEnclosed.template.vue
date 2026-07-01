<template>
  <Layout :variant="LAYOUT_VARIANTS.SPLIT_VERTICAL">
    <template #content-header>
      <slot name="product-details" />
    </template>

    <template #content>
      <slot name="configuration" />
    </template>

    <template #aside>
      <slot name="pricing" />
      <slot name="actions" />
      <slot name="errors" />
      <slot name="markdown" />
    </template>

    <template #footer>
      <slot name="terms" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";
import { useSection } from "../../../components/section/useSection";
import Layout from "../../../components/layout/Layout.vue";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_BACKGROUND } from "../../../components/header/types";

// -----------------------------------------------------------------------------
defineOptions({
  inheritAttrs: false
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

  useFooter({});
});
</script>
