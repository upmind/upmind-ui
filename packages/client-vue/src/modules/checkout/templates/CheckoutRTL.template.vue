<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL">
    <template #navigation>
      <div>
        <Back @click.prevent="doReject" button />
      </div>
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
import CheckoutHeader from "../components/CheckoutHeader.vue";
import CheckoutContent from "../components/CheckoutContent.vue";
import CheckoutAside from "../components/CheckoutAside.vue";

// --- types
import { FOOTER_TEMPLATE } from "../../../components/footer/types";
import { LAYOUT_VARIANTS } from "../../../components/layout/types";

// --- methods
const { setTemplate } = useFooter();
setTemplate(FOOTER_TEMPLATE.TWO_COLUMN_RTL);

const { navigateBack } = useRoutingEngine();

function doReject() {
  navigateBack();
}
</script>
