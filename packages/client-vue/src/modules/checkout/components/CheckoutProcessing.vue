<template>
  <Interstitial
    open
    modal
    size="2xl"
    :animatedIcon="{
      icon: processingIcon,
      primaryColor: 'primary',
      secondaryColor: 'secondary',
      size: '4xl'
    }"
    :title="processingTitle"
    :text="processingText"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useBasketPaymentDetails
} from "@upmind-automation/headless";

// --- components
import { Interstitial } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta } = useBasket();
const { meta: paymentDetailsMeta } = useBasketPaymentDetails();

const processingTitle = computed(() => {
  if (meta.value.needsApproval) {
    return t("cart.payment_awaiting_approval_md");
  }

  if (meta.value.isConverting) {
    return t("cart.order_converting_md");
  }

  if (meta.value.isPaying) {
    return t("cart.payment_processing_md");
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
  if (meta.value.needsApproval) {
    return t("cart.payment_awaiting_approval_msg");
  }

  if (meta.value.isConverting) {
    return t("cart.order_converting_msg");
  }

  if (meta.value.isPaying) {
    return t("cart.payment_processing_msg");
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
  if (meta.value.needsApproval) {
    return "tapping-card";
  }

  if (meta.value.isConverting) {
    return "receipt";
  }

  if (meta.value.isPaying) {
    return "tapping-card";
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
