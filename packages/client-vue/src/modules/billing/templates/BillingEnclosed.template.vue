<template>
  <Layout :variant="LAYOUT_VARIANTS.SPLIT_VERTICAL">
    <template #content-header>
      <slot name="hero" />
    </template>

    <template #content>
      <slot name="content" />
    </template>

    <template #aside>
      <slot name="markdown" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";
import { useSection } from "../../../components/section/useSection";
import Layout from "../../../components/layout/Layout.vue";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

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
