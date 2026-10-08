// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-payment/overlay-payment.scenario
 * @description The pay-INIT overlay — the live pay control an `?init=pay` deep
 * link opens over the invoice page, injected as `<useInvoice>--payment`.
 *
 * It is a MODULE rather than a loose page under `app/pages/overlays/` because
 * `registerOverlayRoutes` needs only a registered route to clone, and a
 * scenario route is one: the declaration owns the key, the url segment and the
 * sidebar entry, so the overlay is also driveable in its own right.
 *
 * This module DRAWS ITSELF: `OverlayPaymentPage.vue` beside this file is the
 * route's component. It boots no collection and no editor — the paying is the invoice record's own
 * `UpmOrder` payment slot — nothing extracted.
 *
 * The directory name IS `ROUTE.OVERLAY_PAYMENT`, which is the name
 * `LABS_OVERLAYS` maps the `payment` suffix to.
 */

import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const OVERLAY_PAYMENT_SCENARIO = "overlay_payment";

export default {
  key: OVERLAY_PAYMENT_SCENARIO,
  page: "OverlayPaymentPage.vue",
  presentation: {
    icon: "credit-card-01"
  }
} satisfies ScenarioDeclaration;
