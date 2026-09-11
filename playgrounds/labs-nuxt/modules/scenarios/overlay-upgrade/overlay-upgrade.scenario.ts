// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-upgrade/overlay-upgrade.scenario
 * @description The upgrade OVERLAY — the surface `?init=upgrade` opens over the
 * contract-product page, injected as `<parent>--upgrade`.
 *
 * It is a MODULE rather than a loose page under `app/pages/overlays/` because
 * `registerOverlayRoutes` needs only a registered route to clone, and a
 * scenario route is one: the declaration owns the key, the url segment and the
 * sidebar entry, so the overlay is also driveable in its own right.
 *
 * STUB until CT-1 (FE-3029) + CT-2 (FE-3206). This module DRAWS ITSELF and
 * boots no composable: the migrations legacy listed here come from the
 * contracts module CT-1 has not built.
 *
 * The directory name IS `ROUTE.OVERLAY_UPGRADE`, which is the name
 * `LABS_OVERLAYS` maps the `upgrade` suffix to.
 */

import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const OVERLAY_UPGRADE_SCENARIO = "overlay_upgrade";

export default {
  key: OVERLAY_UPGRADE_SCENARIO,
  presentation: {
    icon: "box"
  }
} satisfies ScenarioDeclaration;
