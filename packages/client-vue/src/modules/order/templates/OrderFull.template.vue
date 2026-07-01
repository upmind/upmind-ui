<template>
  <Layout :variant="LAYOUT_VARIANTS.FULL">
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
import { onMounted } from "vue";
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import Layout from "../../../components/layout/Layout.vue";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

onMounted(() => {
  useHeader({});

  useFooter({
    noCurrency: true
  });
});
</script>
