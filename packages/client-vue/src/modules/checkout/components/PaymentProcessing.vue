<template>
  <slot name="processing" v-if="meta.isCheckout">
    <Interstitial
      open
      to="#vue-app"
      modal
      size="2xl"
      :animatedIcon="{
        icon: processingIcon,
        primaryColor: 'primary',
        secondaryColor: 'secondary',
        size: '4xl'
      }"
      :title="t(processingTitleKey)"
      :text="t(processingTextKey)"
    >
      <template #title>
        <SmartTitle :i18n-key="processingTitleKey" align="center" />
      </template>
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
import SmartTitle from "../../../components/content/SmartTitle.vue";

// -----------------------------------------------------------------------------

const { meta } = useBasket();
const { meta: paymentDetailsMeta } = useBasketPaymentDetails();
const { t } = useI18n();

const processingTitleKey = computed(() => {
  if (meta.value.needsApproval) {
    return "checkout.processing.approval.title";
  }

  if (meta.value.isConverting) {
    return "checkout.processing.converting.title";
  }

  if (meta.value.isPaying) {
    return "checkout.processing.paying.title";
  }

  if (meta.value.isCheckout) {
    return "checkout.processing.default.title";
  }

  if (paymentDetailsMeta.value.isFree) {
    return "checkout.processing.noCharge.title";
  }

  return "checkout.processing.invalid.title";
});

const processingTextKey = computed(() => {
  if (meta.value.needsApproval) {
    return "checkout.processing.approval.text";
  }

  if (meta.value.isConverting) {
    return "checkout.processing.converting.text";
  }

  if (meta.value.isPaying) {
    return "checkout.processing.paying.text";
  }

  if (meta.value.isCheckout) {
    return "checkout.processing.default.text";
  }

  if (paymentDetailsMeta.value.isFree) {
    return "checkout.processing.noCharge.text";
  }

  return "checkout.processing.invalid.text";
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
