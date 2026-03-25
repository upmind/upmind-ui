// -----------------------------------------------------------------------------
/**
 * @module overlays/registry
 * @description Maps overlay IDs to lazy-loaded overlay content components.
 * Adding a new overlay type requires one entry here and one in GLOBAL_OVERLAYS.
 */

// --- external
import { defineAsyncComponent } from "vue";

// -----------------------------------------------------------------------------

/**
 * Registry mapping overlayId → lazy-loaded content component.
 * The layout resolves the component from this registry using the
 * `overlayId` from route meta.
 */
export const OVERLAY_REGISTRY: Record<
  string,
  ReturnType<typeof defineAsyncComponent>
> = {
  auth: defineAsyncComponent(() => import("./AuthOverlay.vue")),
  // NB: 2FA and verify-email are internal steps within the Auth flow.
  // The Auth component handles `login → 2FA challenge` and `register → verify-email`
  // transitions automatically via the guest state machine.
  "2fa": defineAsyncComponent(() => import("./AuthOverlay.vue")),
  "verify-email": defineAsyncComponent(() => import("./AuthOverlay.vue"))
};
