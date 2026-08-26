<template>
  <Interstitial
    :close-label="t('action.close')"
    :open="!meta.isPaying && !meta.needsApproval"
    modal
    :animatedIcon="{
      icon: processingIcon,
      primaryColor: 'primary',
      secondaryColor: 'secondary',
      size: 'xl'
    }"
    :title="processingTitle"
    :text="processingText"
  />

  <PaymentProcessing :open="meta.isPaying || meta.needsApproval" />
</template>

<script lang="ts" setup>
import { Interstitial } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  useBasket,
  useBasketPaymentDetails
} from "@upmind-automation/headless";
import PaymentProcessing from "../../payment/components/PaymentProcessing.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta } = useBasket();
const { meta: paymentDetailsMeta } = useBasketPaymentDetails();

const processingTitle = computed(() => {
  if (meta.value.isConverting) {
    return t("cart.order_converting_md");
  }

  if (meta.value.isCheckout) {
    return t("cart.payment_checking_details_md");
  }

  if (paymentDetailsMeta.value.isFree) {
    return t("cart.order_processing_md");
  }

  return t("cart.order_unsuccessful_md");
});

const processingText = computed(() => {
  if (meta.value.isConverting) {
    return t("cart.order_converting_msg");
  }

  if (meta.value.isCheckout) {
    return t("cart.payment_verifying_msg");
  }

  if (paymentDetailsMeta.value.isFree) {
    return t("cart.order_processing_msg");
  }

  return t("cart.payment_check_details_msg");
});

const processingIcon = computed(() => {
  if (meta.value.isConverting) {
    return "receipt";
  }

  if (meta.value.isCheckout) {
    return "tapping-card";
  }

  if (paymentDetailsMeta.value.isFree) {
    return "basket";
  }

  return "basket";
});
</script>
