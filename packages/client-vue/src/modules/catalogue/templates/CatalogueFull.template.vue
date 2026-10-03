<template>
  <Layout>
    <template #content-header>
      <slot name="content-header" />
    </template>

    <template #content>
      <slot name="content" />
    </template>

    <template #aside-footer>
      <slot name="aside-footer" />
    </template>

    <template #content-footer>
      <slot name="content-footer" />
    </template>
  </Layout>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useFooter } from "../../../components/footer/useFooter";
import { useHeader } from "../../../components/header/useHeader";
import Layout from "../../../components/layout/Layout.vue";
import { useLayout } from "../../../components/layout/useLayout";

defineOptions({
  inheritAttrs: false
});

onMounted(() => {
  // TODO: Reset the layout until we implement the templates for catalogue
  useLayout({});
  useHeader({});
  useFooter({});
});
</script>
