// -----------------------------------------------------------------------------
/**
 * @module scenarios/usePaymentDetailAdd/payment-detail-add.scenario
 * @description Storing a payment method with no basket, invoice or order behind
 * it — the payment-detail machine's ADD context.
 *
 * This module DRAWS ITSELF: `payment-detail-add.page.vue` beside this file is
 * the route's component, so the shared renderer never sees it. The reason is
 * `usePaymentDetails`, which is not four-layer yet — it publishes no `.as(actor)`
 * builder, so it cannot be a `useList` and the declared table, card and detail
 * surfaces have nothing to bind to. The page reaches the composable directly
 * until that conversion lands.
 *
 * Registration is unchanged by that: the key, the icon, the url segment and the
 * sidebar entry all come from here, exactly as they do for a playground-drawn
 * module.
 */

import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const PAYMENT_DETAIL_ADD_SCENARIO = "payment_detail_add";

export default {
  key: PAYMENT_DETAIL_ADD_SCENARIO,
  presentation: {
    icon: "credit-card-01"
  }
} satisfies ScenarioDeclaration;
