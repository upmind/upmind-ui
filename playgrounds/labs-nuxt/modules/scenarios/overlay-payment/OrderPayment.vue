<template>
  <template v-if="meta.isAvailable">
    <UpmPaymentDetails
      v-if="!meta.isLocked"
      v-show="!meta.isProcessing"
      :label="t('action.pay_now')"
      :processing="meta.isProcessing"
      @resolve="order.pay"
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
 * This is a LABS duplicate of the payment slot of client-vue's `Order.vue`,
 * split out here so the order PAGE shows the order without payment and the pay
 * MODAL shows the payment only — different surfaces, not the same component in
 * both. Nothing in `client-vue` changes; the pieces it exposes publicly
 * (`UpmPaymentDetails`, `Icon`, `useOrder`) are reused as they are.
 *
 * The invoice arrives as a PROP; this never reads the route. The default slot
 * renders inside the payment context, so the host can add `UpmPaymentProcessing`
 * for an inline 3DS challenge without a second engine.
 */

import { useQueryClient } from "@tanstack/vue-query";
import { computed, onMounted, provide, watch } from "vue";
import { useI18n } from "vue-i18n";
import { UpmPaymentDetails } from "@upmind-automation/client-vue";
import { useInvoice } from "@upmind-automation/headless";
import type { InvoicePaymentChallenge } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<{ invoiceId: string }>();

/** A payment settled (full or partial), or the invoice was already paid — the
 * host closes the modal and routes back to the order. */
const emit = defineEmits<{ success: [] }>();

const { t } = useI18n();
const queryClient = useQueryClient();

const order = useInvoice().withId(props.invoiceId);

await order.useActions().isReady();

const { model: invoice } = order.useContext();
const invoiceMeta = order.useMeta();
const { renderChallenge, cancelChallenge } = order.useActions();
const { paymentDetail } = order.useInternals();

// The provided challenge reads a single meta object; fold the flags it uses.
const meta = computed(() => ({
  isComplete: invoiceMeta.isComplete.value,
  isRenderingChallenge: invoiceMeta.isRenderingChallenge.value,
  needsApproval: invoiceMeta.needsApproval.value
}));

// A payment is a MUTATION: the order page underneath reads the same invoice
// through vue-query and would otherwise show its stale, pre-payment cache. So on
// settle, invalidate the order + invoice queries (forcing a refetch on the page)
// BEFORE closing, then close.
async function settle() {
  await queryClient.invalidateQueries({ queryKey: ["order", props.invoiceId] });
  await queryClient.invalidateQueries({ queryKey: ["invoices"] });
  emit("success");
}

// The invoice was already settled when the modal opened — nothing to pay, so
// close rather than show an empty surface.
onMounted(() => {
  const unpaid = invoice.value?.summary.unpaidAmount ?? 0;
  if (meta.value.isComplete || unpaid <= 0) settle();
});

// A payment recorded — `paidAmount` rises on any successful settle (full or
// partial), which is `useOrder`'s own success signal (it stamps
// `payment_success=true`). Close on the first rise.
watch(
  () => invoice.value?.summary.paidAmount ?? 0,
  (now, was) => {
    if (now > was) settle();
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
