<template>
  <div class="flex flex-col gap-4" data-test-key="order-payment-overlay">
    <Suspense>
      <OrderPayment
        v-slot="{ meta }"
        :invoice-id="invoiceId"
        @success="dismissToOrder"
      >
        <UpmPaymentProcessing v-if="meta.isProcessing" />
      </OrderPayment>

      <template #fallback>
        <div class="flex justify-center p-8">
          <Spinner :label="t('text.loading')" />
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-payment/overlay-payment.page
 * @description The pay-INIT OVERLAY — the "Pay now" surface a `?init=pay` deep
 * link opens over the order page, injected as `<order>--payment`.
 *
 * It renders the pay block ONLY (`OrderPayment` beside this file, a LABS
 * duplicate of client-vue Order.vue's payment slot), NOT the whole order page —
 * the order page shows the order without payment, the modal shows payment only.
 *
 * It is NOT `app/pages/overlays/pay.vue`. That one resumes an off-site gateway
 * return and does no work by design; with `?init=pay` no operation is in flight,
 * so it would park the payer on a spinner forever.
 *
 * DISMISSABLE: nothing is mid-flight here, so closing the panel loses nothing.
 *
 * The invoice comes off the parent route's own `:oid` — this is injected as a
 * CHILD of `/order/:oid` and the funnel's target carries the page's params — and
 * is handed to the pay block as a prop. Reached from the sidebar as a page in its
 * own right there is no parent, so the same word is read off the query.
 */

import { Spinner } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { OverlayType } from "@upmind-automation/headless";
import { UpmPaymentProcessing } from "@upmind-automation/payment";
import { QUERY_PARAMS } from "@upmind-automation/types";
import OrderPayment from "./OrderPayment.vue";
import { get, omit, toString } from "lodash-es";
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.OVERLAY_PAYMENT,
  overlay: OverlayType.MODAL,
  dismissable: true,
  // One size up from the default max-w-lg modal, to sit closer to the order
  // layout's payment column width.
  size: "xl"
});

const { t } = useI18n();
const route = useRoute();

const invoiceId = toString(
  get(route.params, QUERY_PARAMS.ORDER_ID) ||
    get(route.query, QUERY_PARAMS.ORDER_ID)
);

// On a settled payment, close the overlay by routing to the order page itself —
// the parent this modal opened over — dropping the `--payment` child and the
// gateway-return query (`payment_success`). Navigating to a route with no
// overlay meta is what dismisses the overlay.
async function dismissToOrder() {
  // Return to whatever page this overlay opened over — its own name less the
  // `--payment` suffix — keeping `?oid` so the invoice re-reads, dropping the
  // spent `?init` and the gateway-return `payment_success`.
  const parent = toString(route.name).replace(/--[^-]+$/, "");
  await navigateTo({
    name: parent,
    params: route.params,
    query: omit(route.query, ["payment_success", QUERY_PARAMS.INIT]),
    replace: true
  });
}
</script>
