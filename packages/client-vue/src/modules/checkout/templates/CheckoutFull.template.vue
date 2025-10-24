<template>
  <Layout :variant="LAYOUT_VARIANTS.FULL">
    <template #navigation>
      <Back @click.prevent="doReject" />
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
// --- internal
import { useRoutingEngine } from "@upmind-automation/headless";
import { useFooter } from "../../../components/footer/useFooter";

// --- components
import Layout from "../../../components/layout/Layout.vue";
import Back from "../../../components/navigation/Back.vue";
import CheckoutHeader from "../components/CheckoutHeader.vue";
import CheckoutContent from "../components/CheckoutContent.vue";
import CheckoutAside from "../components/CheckoutAside.vue";
import CheckoutAsideFooter from "../components/CheckoutAsideFooter.vue";

// --- types
import { FOOTER_TEMPLATE } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

// --- methods
const { setTemplate } = useFooter();
setTemplate(FOOTER_TEMPLATE.FULL);

const { navigateBack } = useRoutingEngine();

function doReject() {
  navigateBack();
}
</script>
