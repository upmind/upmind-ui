<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR">
    <template #content-header>
      <slot name="summary" />
    </template>

    <template #content>
      <slot name="products" />
    </template>

    <template #aside>
      <slot v-if="isMobile" name="errors" />
      <slot name="pricing" />
      <slot v-if="!isMobile" name="errors" />
      <slot name="custom-price" />
      <slot name="markdown" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { useSection } from "@upmind-automation/foundation";
import { Layout } from "@upmind-automation/foundation";
import { isMobile } from "@upmind-automation/foundation";
import { LAYOUT_VARIANTS } from "@upmind-automation/foundation";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import {
  FOOTER_BACKGROUND,
  FOOTER_LAYOUT
} from "../../../components/footer/types";

defineOptions({
  inheritAttrs: false
});

const { ui } = useConfig();

onMounted(() => {
  useHeader({
    noBasket: ui.basketAction.isHidden,
    background: HEADER_BACKGROUND.LTR,
    border: "none",
    items: "end"
  });

  // plain sections (defaults); clears a carded environment left by an
  // enclosed or inset page
  useSection({});

  useFooter({
    layout: FOOTER_LAYOUT.FLAT,
    background: FOOTER_BACKGROUND.LTR,
    items: "end",
    justifyRight: "start"
  });
});
</script>
