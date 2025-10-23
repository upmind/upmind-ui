<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_LTR" minimal>
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
import { useRoutingEngine } from "@upmind-automation/headless";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";
import Layout from "../../../components/layout/Layout.vue";
import CheckoutHeader from "../components/CheckoutHeader.vue";
import CheckoutContent from "../components/CheckoutContent.vue";
import CheckoutAside from "../components/CheckoutAside.vue";

const { navigateBack } = useRoutingEngine();

function doReject() {
  navigateBack();
}
</script>
