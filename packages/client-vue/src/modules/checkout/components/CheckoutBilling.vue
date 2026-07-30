<template>
  <!-- Billing. Both the summary and the form await client data in async setup,
       so they share one Suspense (no page-suspending, no double skeleton). A
       real box (not display:contents) so a Place Order attempt can scroll it
       into view. -->
  <div id="checkout-billing">
    <Suspense>
      <!-- Single wrapper: Suspense takes one root. The summary and the form both
           stay mounted for the whole visit and swap with v-show — both await client
           data, so mounting either one late re-suspends the shared boundary and
           flashes the fallback over the swap. -->
      <div>
        <BillingSummary v-show="meta.showSummary" :card="card" @edit="onEdit" />
        <BillingSummarySkeleton v-if="meta.showSkeleton" :card="card" />
        <!-- BillingForm has two roots (Loading + Teleport), so v-show can't apply
             to it directly — it needs this wrapper to hide behind. -->
        <div v-show="meta.showForm">
          <BillingForm
            inline
            :card="card"
            :inline-editing="billingData.billingDetailsDisabled"
            :auto-update="autoUpdate"
            :touched="basketMeta.showErrors"
            @resolve="editing = false"
          />
        </div>
      </div>
      <!-- The loaded states are all Sections (BillingSummary, BillingForm and
           BillingSummarySkeleton each render one regardless of card), so the
           fallback frames itself too — otherwise the heading pops in on resolve. -->
      <template #fallback>
        <BillingSummarySkeleton v-if="billingModel?.addressId" :card="card" />
        <Section v-else :label="t('text.billing_details')" icon="building-07">
          <ManageSkeleton>
            <Skeleton :class="styles.checkout.billing.skeletonDetail" />
          </ManageSkeleton>
        </Section>
      </template>
    </Suspense>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  UIContext,
  useBasket,
  useBasketBilling,
  useConfig,
  useRoutingEngine
} from "@upmind-automation/headless";
import stylesConfig from "../checkout.config";

// --- components
import Section from "../../../components/section/Section.vue";
import { useSection } from "../../../components/section/useSection";
import BillingForm from "../../billing/components/BillingForm.vue";
import BillingSummary from "../../billing/components/BillingSummary.vue";
import BillingSummarySkeleton from "../../billing/components/BillingSummarySkeleton.vue";
import ManageSkeleton from "../../../components/manage/Skeleton.vue";
import { Skeleton, useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { CheckoutBillingProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<CheckoutBillingProps>();

const editing = defineModel<boolean>("editing", { default: false });

const styles = useStyles(["checkout.billing"], props, stylesConfig);

const { t } = useI18n();
const { meta: basketMeta } = useBasket();
const { meta: billingMeta, model: billingModel } = useBasketBilling();
const { ui } = useConfig();
const { data: billingData } = useConfig({ context: UIContext.BILLING_DETAILS });
const { card } = useSection();
const { navigate } = useRoutingEngine();

// Summary vs form. Saved details earn a summary; without them the form shows, so a
// shopper who reaches the checkout without billing can still enter it instead of
// facing an empty summary.
const meta = computed(() => {
  // Saved details from the MODEL, not the machine's `complete` state: the actor
  // leaves `complete` for the length of every update, and it reports complete for
  // a client with no address at all — so `hasBilling` both flicks an empty summary
  // in before anything is entered and drops it again on every save.
  const hasDetails = Boolean(
    billingModel.value?.addressId || billingModel.value?.companyId
  );

  // A commit in flight holds the skeleton, so the summary arrives once and already
  // populated instead of appearing, blanking and returning.
  const showSkeleton =
    ui.billingDetails.isEditable &&
    billingMeta.value.isProcessing &&
    !editing.value;
  const showSummary = hasDetails && !showSkeleton && !editing.value;
  const showForm = !showSummary && !showSkeleton;

  return { showForm, showSkeleton, showSummary };
});

// A first fill autosaves as the shopper goes; an explicit Change is confirmed with
// Continue instead, so the editor doesn't commit half-entered details.
const autoUpdate = computed(() => !editing.value && !meta.value.showSummary);

// Changing saved details belongs on the billing page — the inline form is for
// entering billing the first time. A brand that has disabled that page has nowhere
// to send them, so there the editor opens here rather than the control doing
// nothing.
function onEdit() {
  if (billingData.billingDetailsDisabled) {
    editing.value = true;
    return;
  }
  // the standalone billing step is a plain named route; navigate() takes the
  // funnel's own target shape, which vue-router's location type doesn't satisfy
  navigate({ name: props.billingRoute.name });
}
</script>
