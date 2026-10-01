<template>
  <template v-if="orderMeta.isAvailable">
    <PaymentDetails
      v-if="!orderMeta.isLocked"
      v-show="!orderMeta.isProcessing"
      :label="t('action.pay_now')"
      :processing="orderMeta.isProcessing"
      @resolve="pay"
    />
  </template>

  <PaymentProcessing v-if="orderMeta.isProcessing" />
</template>

<script lang="ts" setup>
import { computed, provide, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  useInvoice,
  type InvoicePaymentChallenge
} from "@upmind-automation/headless";
import PaymentDetails from "./PaymentDetails.vue";
import PaymentProcessing from "./PaymentProcessing.vue";
import type { PaymentProps } from "../types";

const props = defineProps<PaymentProps>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

// -----------------------------------------------------------------------------

const invoiceCell = useInvoice().withId(props.invoiceId);
const { paymentDetail } = invoiceCell.useInternals();
const invoiceMeta = invoiceCell.useMeta();
const { cancelChallenge, isReady, pay, renderChallenge } =
  invoiceCell.useActions();

await isReady();

// The template and script read a single meta object; the scoped composable now
// publishes one computed per flag, so they are folded back into one here.
const orderMeta = computed(() => ({
  hasError: invoiceMeta.hasError.value,
  isAuthenticated: invoiceMeta.isAuthenticated.value,
  isAvailable: invoiceMeta.isAvailable.value,
  isComplete: invoiceMeta.isComplete.value,
  isFree: invoiceMeta.isFree.value,
  isLoading: invoiceMeta.isLoading.value,
  isLocked: invoiceMeta.isLocked.value,
  isPartial: invoiceMeta.isPartial.value,
  isPaymentDue: invoiceMeta.isPaymentDue.value,
  isPending: invoiceMeta.isPending.value,
  isProcessing: invoiceMeta.isProcessing.value,
  isRenderingChallenge: invoiceMeta.isRenderingChallenge.value,
  isUnavailable: invoiceMeta.isUnavailable.value,
  needsApproval: invoiceMeta.needsApproval.value
}));

provide("usePaymentDetail", paymentDetail);
provide("usePaymentChallenge", {
  renderChallenge,
  cancelChallenge,
  meta: orderMeta
} satisfies InvoicePaymentChallenge);

// -----------------------------------------------------------------------------

watch(
  () => orderMeta.value.isProcessing,
  processing => {
    if (processing) {
      window.scrollTo(0, 0);
    }
  }
);
</script>
