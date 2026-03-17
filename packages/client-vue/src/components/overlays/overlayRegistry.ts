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
  auth: defineAsyncComponent(() => import("./AuthOverlay.vue"))
};
