<template>
  <Layout :variant="LAYOUT_VARIANTS.FULL">
    <template #content-header>
      <slot name="summary" />
    </template>

    <template #content>
      <slot name="products" />
    </template>

    <template #aside>
      <slot name="pricing" />
      <slot name="errors" />
      <slot name="custom-price" />
      <slot name="markdown" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

defineOptions({
  inheritAttrs: false
});

onMounted(() => {
  useHeader({});
  useFooter({});
});
</script>
