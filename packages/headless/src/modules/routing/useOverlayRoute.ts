// -----------------------------------------------------------------------------
/**
 * @module routing/useOverlayRoute
 * @description Composable for controlling overlay routes (modals/drawers)
 * triggered by named route endpoints. Watches the current route's matched
 * records for overlay meta and exposes reactive state + close() method.
 */

// --- external
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

// --- utils
import { find } from "lodash-es";

// --- types
import { OverlayType } from "./types";

// -----------------------------------------------------------------------------

/**
 * Composable for controlling overlay routes (modals/drawers).
 * Watches the current route's matched records for overlay meta
 * and exposes reactive state for rendering the correct overlay.
 */
export function useOverlayRoute() {
  const route = useRoute();
  const router = useRouter();

  // --- state

  const overlayMeta = computed(() => {
    const overlayRoute = find(route.matched, r => !!r.meta?.overlay);
    return overlayRoute?.meta;
  });

  /** Whether an overlay is currently active */
  const isOpen = computed(() => !!overlayMeta.value?.overlay);

  /** Overlay type (modal/drawer) — from route meta, overridable by brand UI setting */
  const overlayType = computed(
    () => overlayMeta.value?.overlay as OverlayType | undefined
  );

  /** Overlay identifier: 'auth', '2fa', 'verify-email', etc. */
  const overlayId = computed(
    () => overlayMeta.value?.overlayId as string | undefined
  );

  // --- methods

  /** Close overlay and navigate to returnUrl or back to parent */
  function close(): void {
    const returnUrl = route.query?.returnUrl as string | undefined;
    if (returnUrl) {
      router.push({ name: returnUrl });
    } else {
      router.back();
    }
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    /** Whether an overlay is currently active */
    isOpen,
    /** The overlay identifier */
    overlayId,
    /** The overlay render type: 'modal' | 'drawer' */
    overlayType,
    // --- methods
    /** Close the overlay */
    close
  };
}

export type UseOverlayRoute = ReturnType<typeof useOverlayRoute>;
