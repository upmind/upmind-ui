<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR">
    <template #content-header>
      <!-- <slot name="content-header" /> -->
    </template>

    <template #content>
      <slot name="errors" />
      <slot name="configuration" />
      <slot name="apply-to-others" />
    </template>

    <template #aside>
      <slot name="content-header" />
      <slot name="aside" />
    </template>

    <template #aside-footer>
      <slot name="progress" />
    </template>

    <template #content-footer>
      <slot name="actions" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useConfig } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";
import { useLayout } from "../../../components/layout/useLayout";
import { useSection } from "../../../components/section/useSection";
import Layout from "../../../components/layout/Layout.vue";
import { isMobile } from "@upmind-automation/upmind-ui";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import { FOOTER_BACKGROUND } from "../../../components/footer/types";
import { FOOTER_LAYOUT } from "../../../components/footer/types";

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

useLayout({
  variant: LAYOUT_VARIANTS.TWO_COLUMN_LTR
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
