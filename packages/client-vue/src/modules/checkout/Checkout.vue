<template>
  <Checkout>
    <template #billing-details-title>
      <i18n-t
        keypath="basket.billing_details.title"
        tag="span"
        for="basket.billing_details.title"
        class="text-primary font-bold"
      >
        <mask
          v-if="!paymentDetailsMeta.isFree"
          class="bg-quarternary leading-relaxed"
          >{{ t("basket.billing_details.details") }}</mask
        >
        <mask v-else class="bg-quarternary leading-relaxed">{{
          t("basket.billing_details.your")
        }}</mask>
      </i18n-t>
    </template>

    <template #payment-details-title>
      <template v-if="paymentDetailsMeta.isFree">
        <mask class="bg-accent leading-relaxed">{{
          t("basket.payment_details.details")
        }}</mask>
      </template>
      <template v-else>
        <i18n-t
          keypath="basket.payment_details.title"
          tag="span"
          for="basket.payment_details.title"
          class="text-primary font-bold"
        >
          <mask class="bg-accent">{{
            t("basket.payment_details.details")
          }}</mask>
        </i18n-t>
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

// --- utils
import { useI18n } from "vue-i18n";

const { meta: paymentDetailsMeta } = useBasketPaymentDetails();

const { t } = useI18n();
</script>
