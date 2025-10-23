<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL" minimal>
    <template #navigation>
      <Back @click.prevent="doReject" button />
    </template>

    <template #content-header>
      <CheckoutHeader />
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
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";
import Layout from "../../../components/layout/Layout.vue";
import Back from "../../../components/navigation/Back.vue";
import CheckoutHeader from "../components/CheckoutHeader.vue";
import CheckoutContent from "../components/CheckoutContent.vue";
import CheckoutAside from "../components/CheckoutAside.vue";
import CheckoutAsideFooter from "../components/CheckoutAsideFooter.vue";

const { navigateBack } = useRoutingEngine();

function doReject() {
  navigateBack();
}
</script>
