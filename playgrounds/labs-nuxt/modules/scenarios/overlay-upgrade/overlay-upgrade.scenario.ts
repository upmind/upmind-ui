// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-upgrade/overlay-upgrade.scenario
 * @description The upgrade OVERLAY — the surface `?init=upgrade` opens over the
 * contract-product page, injected as `<parent>--upgrade`.
 *
 * It is a MODULE rather than a loose page under `app/pages/overlays/` because
 * `registerOverlayRoutes` needs only a registered route to clone, and a
 * scenario route is one: the declaration owns the key, the url segment and the
 * sidebar entry.
 *
 * This module DRAWS ITSELF: a modal with no scenario bar, so it declares no
 * `useManage` and no `tracks`. Its page reads the product the page beneath
 * already holds.
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
  page: "OverlayUpgradePage.vue",
  presentation: {
    icon: "switch-horizontal-01"
  }
} satisfies ScenarioDeclaration;
