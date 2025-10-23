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
import { useI18n } from "vue-i18n";
import { useBasket, useRoutingEngine } from "@upmind-automation/headless";
import { LAYOUT_VARIANTS, Layout } from "@upmind-automation/upmind-ui";
import Back from "../../../components/navigation/Back.vue";
import CheckoutHeader from "../components/CheckoutHeader.vue";
import CheckoutContent from "../components/CheckoutContent.vue";
import CheckoutAside from "../components/CheckoutAside.vue";

const { t } = useI18n();
const { navigateBack } = useRoutingEngine();
const { meta, errors } = useBasket();

function doReject() {
  navigateBack();
}
</script>
