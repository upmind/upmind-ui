<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL">
    <template #content-header>
      <slot
        name="product-details"
        :direction="PRODUCT_HERO_DIRECTION.VERTICAL"
      />
      <slot name="markdown" />
    </template>

    <template #content>
      <slot name="configuration" />
    </template>

    <template #aside>
      <slot name="errors" />
      <slot name="pricing" :show-total="isMobile" />
    </template>

    <template #footer>
      <slot name="terms" />
    </template>

    <template #content-footer>
      <slot name="actions" />
    </template>

    <template #aside-footer>
      <slot name="total" />
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
import { PRODUCT_HERO_DIRECTION } from "@upmind-automation/product";

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
