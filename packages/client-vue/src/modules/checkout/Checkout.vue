<template>
  <Checkout>
    <template #billing-details-title>
      <SmartTitle i18n-key="basket.billing_details.title" size="2xl" />
    </template>

    <template #payment-details-title>
      <template v-if="paymentDetailsMeta.isFree">
        <SmartTitle i18n-key="basket.payment_details.details" size="2xl" />
      </template>
      <template v-else>
        <SmartTitle i18n-key="basket.payment_details.title" size="2xl" />
      </template>
    </template>

    <template #processing-title="{ processingTitle }">
      <SmartTitle :i18n-key="processingTitle" size="2xl" />
    </template>
  </Checkout>
</template>

<script lang="ts" setup>
// --- components
import { useBasketPaymentDetails } from "@upmind-automation/headless-vue";
import Checkout from "./components/Checkout.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// --- utils
import { useI18n } from "vue-i18n";

const { meta: paymentDetailsMeta } = useBasketPaymentDetails();

const { t } = useI18n();
</script>
