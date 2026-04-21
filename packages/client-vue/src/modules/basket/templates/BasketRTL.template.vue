<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL">
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
      <slot name="custom-price" />
      <slot name="markdown" />
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
import { isMobile } from "@upmind-automation/upmind-ui";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- types
import { HEADER_BACKGROUND } from "../../../components/header/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

defineOptions({
  inheritAttrs: false
});

onMounted(() => {
  useHeader({
    background: HEADER_BACKGROUND.RTL,
    border: "none",
    items: "end"
  });

  useFooter({});
});
</script>
