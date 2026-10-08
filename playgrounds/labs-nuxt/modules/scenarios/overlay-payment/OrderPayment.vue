<template>
  <template v-if="meta.isAvailable">
    <Section
      v-if="invoiceMeta.hasPaymentCurrencyChoice.value"
      icon="switch-horizontal-01"
      :label="t('invoices.detail.switch_currency')"
    >
      <UpmCurrencySelect
        :model-value="invoice?.currencyPayment?.code"
        :currencies="currencies"
        :disabled="meta.isProcessing"
        @update:model-value="
          code => code && order.useActions().setCurrency(String(code))
        "
      />
    </Section>

    <UpmPaymentDetails
      v-if="!meta.isLocked"
      v-show="!meta.isProcessing"
      :label="t('action.pay_now')"
      :processing="meta.isProcessing"
      @resolve="pay"
    />

    <slot :meta="meta" />
  </template>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-payment/OrderPayment
 * @description The pay block ONLY — the "Pay now" surface a `?init=pay` deep
 * link opens in the modal: the payment context `UpmPaymentDetails` consumes,
 * the pay control itself, and its due/failed/locked and pending/partial alerts.
 *
 * This is a LABS duplicate of the payment slot of `invoice`'s `Order.vue`,
 * split out here so the invoice PAGE shows the order without payment and the pay
 * MODAL shows the payment only — different surfaces, not the same component in
 * both. The pieces the packages expose publicly (`UpmPaymentDetails`,
 * `UpmCurrencySelect`, `useInvoice`) are reused as they are.
 *
 * The invoice arrives as a PROP; this never reads the route. The default slot
 * renders inside the payment context, so the host can add `UpmPaymentProcessing`
 * for an inline 3DS challenge without a second engine.
 */

import { computed, onMounted, provide, watch } from "vue";
import { useI18n } from "vue-i18n";
import { UpmCurrencySelect } from "@upmind-automation/basket";
import { Section } from "@upmind-automation/foundation";
import { useBrand, useInvoice } from "@upmind-automation/headless";
import { UpmPaymentDetails } from "@upmind-automation/payment";
import type { InvoicePaymentChallenge } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<{ invoiceId: string }>();

/** A payment settled (full or partial), or the invoice was already paid — the
 * host closes the modal and routes back to the order. */
const emit = defineEmits<{ success: [] }>();

const { t } = useI18n();

const order = useInvoice().withId(props.invoiceId);

await order.useActions().isReady();

const { model: invoice } = order.useContext();
const invoiceMeta = order.useMeta();
const { cancelChallenge, pay, renderChallenge } = order.useActions();
const { paymentDetail } = order.useInternals();
const { currencies } = useBrand();

// The provided challenge reads a single meta object; fold the flags it uses.
const meta = computed(() => ({
  isAvailable: invoiceMeta.isAvailable.value,
  isComplete: invoiceMeta.isComplete.value,
  isFree: invoiceMeta.isFree.value,
  isLocked: invoiceMeta.isLocked.value,
  isProcessing: invoiceMeta.isProcessing.value,
  isRenderingChallenge: invoiceMeta.isRenderingChallenge.value,
  isSettling: invoiceMeta.isSettling.value,
  needsApproval: invoiceMeta.needsApproval.value
}));

// The module invalidates the order + invoice caches inside its post-payment
// refresh, so the page only signals the host to close.
function settle() {
  emit("success");
}

// The invoice was already settled when the modal opened — nothing to pay, so
// close rather than show an empty surface.
onMounted(() => {
  if (meta.value.isComplete || meta.value.isFree) settle();
});

// A payment landed — the machine enters its post-payment refresh (full or
// partial). Close on that signal instead of watching the summary total.
watch(
  () => meta.value.isSettling,
  isSettling => {
    if (isSettling) settle();
  }
);

provide("usePaymentDetail", paymentDetail);
provide("usePaymentChallenge", {
  renderChallenge,
  cancelChallenge,
  meta
} satisfies InvoicePaymentChallenge);
provide("orderInvoice", invoice);
</script>
