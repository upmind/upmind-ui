// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-pay/overlay-pay.scenario
 * @description The off-site gateway-RETURN overlay — the "resuming payment"
 * surface the funnel parks the payer on while an `?operation_id` return is dealt
 * with, injected as `<order>--pay` (FE-3133 / FE-3030). It does no work by
 * design; the funnel navigates away the moment the operation settles.
 *
 * It is a MODULE rather than a loose page under `app/pages/overlays/` — the same
 * shape as `overlay-payment` — because `registerOverlayRoutes` needs only a
 * registered route to clone, and a scenario route is one: the declaration owns
 * the key, the url segment and the sidebar entry, so the overlay is driveable in
 * its own right.
 *
 * The directory name IS `ROUTE.OVERLAY_PAY`, which is the name `LABS_OVERLAYS`
 * maps the `pay` suffix to.
 */

import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const OVERLAY_PAY_SCENARIO = "overlay_pay";

export default {
  key: OVERLAY_PAY_SCENARIO,
  presentation: {
    icon: "internet"
  }
} satisfies ScenarioDeclaration;
