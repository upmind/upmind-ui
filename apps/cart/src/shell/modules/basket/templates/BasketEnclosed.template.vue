<template>
  <Layout :variant="LAYOUT_VARIANTS.SPLIT_VERTICAL">
    <template #content-header>
      <slot name="summary" />
    </template>

    <template #content>
      <slot name="products" />
    </template>

    <template #aside>
      <slot name="pricing" />
      <slot name="checkout" />
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
import { useSection } from "@upmind-automation/foundation";
import { Layout } from "@upmind-automation/foundation";
import { LAYOUT_VARIANTS } from "@upmind-automation/foundation";
import { HEADER_BACKGROUND } from "../../../components/header/types";

defineOptions({
  inheritAttrs: false
});

const { ui } = useConfig();

onMounted(() => {
  useHeader({
    noBasket: ui.basketAction.isHidden,
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
