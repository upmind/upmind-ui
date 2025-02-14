<template>
  <Checkout>
    <template #billing-details-title>
      <SmartTitle :title="tm('basket.billing_details.title')" size="2xl" />
    </template>

    <template #payment-details-title>
      <template v-if="paymentDetailsMeta.isFree">
        <SmartTitle :title="t('basket.payment_details.details')" size="2xl" />
      </template>
      <template v-else>
        <SmartTitle :title="tm('basket.payment_details.title')" size="2xl" />
      </template>
    </template>

    <template #processing-title="{ processingTitle, processingTitleMask }">
      <i18n-t
        :keypath="processingTitle"
        tag="span"
        :for="processingTitle"
        class="text-primary font-bold"
      >
        <mask class="bg-accent leading-relaxed">{{
          t(processingTitleMask)
        }}</mask>
      </i18n-t>
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

const { t, tm } = useI18n();
</script>
