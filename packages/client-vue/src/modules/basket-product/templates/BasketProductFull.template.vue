<template>
  <Layout :variant="LAYOUT_VARIANTS.FULL">
    <template #navigation>
      <slot name="back" />
    </template>

    <template #actions>
      <slot name="share" />
    </template>

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

  useFooter({});
});
</script>
