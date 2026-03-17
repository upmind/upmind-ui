// -----------------------------------------------------------------------------
/**
 * @module routing/overlays
 * @description Overlay route system for deep-linkable UI overlays (modals/drawers).
 * Dynamically injects child routes onto eligible parent routes so that navigating
 * to e.g. `/basket/auth` opens an auth overlay on the basket page.
 */

// --- external
import { defineComponent } from "vue";
import { filter } from "lodash-es";

// --- types
import type { Router } from "vue-router";
import type { OverlayDefinition } from "./types";
import { OverlayType } from "./types";

// -----------------------------------------------------------------------------

/**
 * Global overlays — injected as children on every eligible route.
 * Each overlay is a single route. Internal step progression (login → 2FA → verify)
 * is driven by composable state, not by sub-routes.
 *
 * `defaultType` is a sensible fallback. Brands override via UI meta:
 *   `@context.cart.overlay.auth.type: "modal" | "drawer"`
 */
export const GLOBAL_OVERLAYS: OverlayDefinition[] = [
  { path: "auth", id: "auth", defaultType: OverlayType.DRAWER },
  { path: "2fa", id: "2fa", defaultType: OverlayType.MODAL },
  { path: "verify-email", id: "verify-email", defaultType: OverlayType.MODAL }
];

// -----------------------------------------------------------------------------

/** Stub — overlays are rendered by the layout, not by <router-view> */
const OverlayStub = defineComponent({ render: () => null });

/**
 * Inject global overlay child routes into all eligible parent routes.
 * Call ONCE at app startup, after all routes are registered.
 *
 * Routes opt out via `meta: { allowOverlays: false }`.
 */
export function registerOverlayRoutes(
  router: Router,
  overlays: OverlayDefinition[] = GLOBAL_OVERLAYS
): void {
  const routes = filter(
    router.getRoutes(),
    r =>
      !!r.name && // must be a named route
      r.meta?.allowOverlays !== false && // opt-out mechanism
      !r.meta?.overlay // don't nest overlays on overlays
  );

  for (const route of routes) {
    for (const overlay of overlays) {
      router.addRoute(route.name!, {
        path: overlay.path,
        name: `${String(route.name)}--${overlay.id}`,
        component: OverlayStub,
        meta: {
          overlay: overlay.defaultType,
          overlayId: overlay.id
        }
      });
    }
  }
}
