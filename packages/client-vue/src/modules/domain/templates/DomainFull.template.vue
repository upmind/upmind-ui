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

// --- internal
import { useSection } from "../../../components/section/useSection";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

// plain sections (defaults); clears a carded environment left by an
// enclosed or inset page
useSection({});
</script>
