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
import { onMounted } from "vue";
import { useFooter } from "../../../components/footer/useFooter";
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { useSection } from "../../../components/section/useSection";
import Layout from "../../../components/layout/Layout.vue";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

defineOptions({
  inheritAttrs: false
});

const { ui } = useConfig();

onMounted(() => {
  useHeader({ noBasket: ui.basketAction.isHidden });
  // plain sections (defaults); clears a carded environment left by an
  // enclosed or inset page
  useSection({});
  useFooter({});
});
</script>
