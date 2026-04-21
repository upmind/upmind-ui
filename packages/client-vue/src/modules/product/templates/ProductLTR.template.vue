<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR">
    <template #content-header>
      <slot name="product-details" />
    </template>

    <template #content>
      <slot name="configuration" />
    </template>

    <template v-if="!isMobile" #aside-header>
      <slot name="image" />
    </template>

    <template #aside>
      <slot v-if="isMobile" name="actions" />
      <slot name="pricing" />
      <slot name="errors" />
      <slot name="markdown" />
    </template>

    <template #footer>
      <slot name="terms" />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- internal
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";

// --- components
import Layout from "../../../components/layout/Layout.vue";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";

// --- types
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import { FOOTER_BACKGROUND } from "../../../components/footer/types";
import { FOOTER_LAYOUT } from "../../../components/footer/types";

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

onMounted(() => {
  useHeader({
    background: HEADER_BACKGROUND.LTR,
    border: "none",
    items: "end"
  });

  useFooter({
    layout: FOOTER_LAYOUT.FLAT,
    background: FOOTER_BACKGROUND.LTR,
    items: "end",
    justifyRight: "start"
  });
});
</script>
