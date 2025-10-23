<template>
  <slot name="processing">
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
    >
    </Interstitial>
  </slot>
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

const { meta } = useBasket();
const { meta: paymentDetailsMeta } = useBasketPaymentDetails();
const { t } = useI18n();

const processingTitle = computed(() => {
  if (meta.value.needsApproval) {
    return t("checkout.processing.approval.title");
  }

  if (meta.value.isConverting) {
    return t("checkout.processing.converting.title");
  }

  if (meta.value.isPaying) {
    return t("checkout.processing.paying.title");
  }

  if (meta.value.isCheckout) {
    return t("checkout.processing.default.title");
  }

  if (paymentDetailsMeta.value.isFree) {
    return t("checkout.processing.noCharge.title");
  }

  return t("checkout.processing.invalid.title");
});

const processingText = computed(() => {
  if (meta.value.needsApproval) {
    return t("checkout.processing.approval.text");
  }

  if (meta.value.isConverting) {
    return t("checkout.processing.converting.text");
  }

  if (meta.value.isPaying) {
    return t("checkout.processing.paying.text");
  }

  if (meta.value.isCheckout) {
    return t("checkout.processing.default.text");
  }

  if (paymentDetailsMeta.value.isFree) {
    return t("checkout.processing.noCharge.text");
  }

  return t("checkout.processing.invalid.text");
});

const processingIcon = computed(() => {
  if (meta.value.needsApproval) {
    return "basket";
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
