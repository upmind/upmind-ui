<template>
  <Layout :variant="LAYOUT_VARIANTS.FULL" minimal>
    <template #content-header>
      <slot name="hero" />
    </template>

    <template #tabs>
      <slot name="tabs" />
    </template>

    <template #content>
      <slot name="results" />
    </template>

    <template #aside-footer>
      <slot name="hint" />
    </template>

    <template #content-footer>
      <slot name="resolve" />
    </template>
  </Layout>
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false
});

import Layout from "../../../components/layout/Layout.vue";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
</script>
