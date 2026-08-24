<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL">
    <template #navigation>
      <slot name="back" />
    </template>

    <template #content-header>
      <slot name="summary" />
      <slot v-if="!isMobile" name="errors" />
    </template>

    <template #content>
      <slot name="products" />
      <slot v-if="isMobile" name="errors" />
      <slot v-if="isMobile" name="pricing" />
    </template>

    <template #aside>
      <slot v-if="!isMobile" name="pricing" />
      <slot name="custom-price" />
      <slot name="markdown" />
    </template>

    <template #aside-footer>
      <slot name="total" />
    </template>

    <template #content-footer>
      <slot name="checkout" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { useSection } from "../../../components/section/useSection";
import { isMobile } from "../../../composables/isMobile";
import Layout from "../../../components/layout/Layout.vue";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

defineOptions({
  inheritAttrs: false
});

const { ui } = useConfig();

onMounted(() => {
  useHeader({
    noBasket: ui.basketAction.isHidden,
    background: HEADER_BACKGROUND.RTL,
    border: "none",
    items: "end"
  });

  // plain sections (defaults); clears a carded environment left by an
  // enclosed or inset page
  useSection({});

  useFooter({});
});
</script>
