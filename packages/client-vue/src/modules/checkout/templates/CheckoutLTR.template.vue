<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR">
    <template #content-header>
      <CheckoutHeader :badge="false" />
    </template>

    <template #content>
      <CheckoutContent section />
    </template>

    <template #aside>
      <CheckoutAside section />
    </template>

    <template #aside-footer>
      <CheckoutAsideFooter />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted, onUnmounted } from "vue";

// --- internal
import { useHeader } from "../../../components/header/useHeader";
import { useFooter } from "../../../components/footer/useFooter";

// --- components
import Layout from "../../../components/layout/Layout.vue";
import CheckoutHeader from "../components/CheckoutHeader.vue";
import CheckoutContent from "../components/CheckoutContent.vue";
import CheckoutAside from "../components/CheckoutAside.vue";

// --- types
import { HEADER_TEMPLATE } from "../../../components/header/types";
import { FOOTER_TEMPLATE } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

onMounted(() => {
  useFooter({
    template: FOOTER_TEMPLATE.TWO_COLUMN_LTR
  });

  useHeader({
    template: HEADER_TEMPLATE.TWO_COLUMN_LTR
  });
});
</script>
