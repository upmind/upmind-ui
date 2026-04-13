<template>
  <Layout>
    <template #content-header>
      <slot name="hero" />
    </template>

    <template #content>
      <slot name="content" />
      <slot v-if="isMobile" name="content-footer" />
    </template>

    <template #aside>
      <slot name="markdown" />
    </template>

    <template v-if="!isMobile" #content-footer>
      <slot name="content-footer" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- internal
import { useLayout } from "../../../components/layout/useLayout";
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

defineOptions({
  inheritAttrs: false
});

useLayout({
  variant: LAYOUT_VARIANTS.FULL
});

onMounted(() => {
  useHeader({});

  useFooter({});
});
</script>
