<template>
  <Layout>
    <template #content-header>
      <slot name="hero" />
    </template>

    <template #content>
      <slot name="cards" />
      <slot name="configure" />
      <slot v-if="isMobile" name="footer" />
    </template>

    <template v-if="!isMobile" #content-footer>
      <slot name="footer" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";
import { useLayout } from "../../../components/layout/useLayout";
import { isMobile } from "@upmind-automation/upmind-ui";
import Layout from "../../../components/layout/Layout.vue";
import {
  LAYOUT_VARIANTS,
  LAYOUT_OVERFLOW
} from "../../../components/layout/types";

defineOptions({
  inheritAttrs: false
});

useLayout({
  variant: LAYOUT_VARIANTS.FULL,
  overflow: LAYOUT_OVERFLOW.CLIP
});

onMounted(() => {
  useHeader({});

  useFooter({});
});
</script>
