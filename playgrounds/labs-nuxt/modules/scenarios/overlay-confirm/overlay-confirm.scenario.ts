// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-confirm/overlay-confirm.scenario
 * @description The confirmation OVERLAY — the one surface a write that raises
 * an invoice asks on before it runs, opened by `?init=confirm` over the
 * contract-product page and injected as `<parent>--confirm`.
 *
 * It is a MODULE rather than a loose page under `app/pages/overlays/` for the
 * reason `overlay-upgrade` is: `registerOverlayRoutes` needs only a registered
 * route to clone, and a scenario route is one.
 *
 * It DRAWS ITSELF: a modal with no scenario bar, so it declares no `useManage`
 * and no `tracks`. Its page reads the product the page beneath already holds.
 *
 * The directory name IS `ROUTE.OVERLAY_CONFIRM`, which is the name
 * `LABS_OVERLAYS` maps the `confirm` suffix to.
 */

import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const OVERLAY_CONFIRM_SCENARIO = "overlay_confirm";

export default {
  key: OVERLAY_CONFIRM_SCENARIO,
  page: "OverlayConfirmPage.vue",
  presentation: {
    icon: "check"
  }
} satisfies ScenarioDeclaration;
