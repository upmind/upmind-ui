<template>
  <Layout :variant="LAYOUT_VARIANTS.FULL" minimal>
    <template #navigation>
      <Back @click.prevent="doReject" />
    </template>

    <template #content-header>
      <CheckoutHeader />
    </template>

    <template #content>
      <CheckoutContent />

      <CheckoutAside />

      <Alert
        v-if="meta.hasErrors"
        color="danger"
        icon="alert-triangle"
        :title="t('error.checkout')"
        :description="errors?.message"
      />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBasket, useRoutingEngine } from "@upmind-automation/headless";
import { LAYOUT_VARIANTS, Alert } from "@upmind-automation/upmind-ui";
import Layout from "../../../components/layout/Layout.vue";
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
