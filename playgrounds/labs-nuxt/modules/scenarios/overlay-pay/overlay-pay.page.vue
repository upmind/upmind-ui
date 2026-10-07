<template>
  <Interstitial
    open
    modal
    :dismissable="false"
    data-test-key="order-pay-overlay"
    :close-label="t('labs.order_pay_close')"
    :aria-label="t('labs.order_pay_resuming')"
    :title="t('labs.order_pay_resuming')"
    :text="t('labs.order_pay_resuming_text')"
    :animated-icon="{ icon: 'internet', size: 'xl' }"
  />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-pay/overlay-pay.page
 * @description The pay OVERLAY — MECHANICAL. It is the surface the funnel parks
 * the payer on while the off-site return is dealt with, injected as the
 * `<order>--pay` child and reached by navigation, never by an imperative mount
 * (FE-3133).
 *
 * IT DOES NO WORK, BY DESIGN. It does not read `operation_id`, register a
 * handler, or dispatch an operation. Doing the work is the FUNNEL's job:
 * `guardOrderReturn` loads the operation and executes it, and restoring a
 * pending gateway operation belongs to `payment-detail.machine`
 * (`hasPendingOperation` → `restoring` → `restoreOperation`). Duplicating either
 * here is what left an empty panel over a settled order.
 *
 * So this renders one thing: the working state. The guard navigates away the
 * moment the operation settles.
 */

import { Interstitial } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { OverlayType } from "@upmind-automation/headless";
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.OVERLAY_PAY,
  overlay: OverlayType.MODAL,
  // Not dismissable: the funnel owns when this closes, not the payer — a
  // dismissed panel mid-return would leave the operation half-done.
  dismissable: false
});

const { t } = useI18n();
</script>
