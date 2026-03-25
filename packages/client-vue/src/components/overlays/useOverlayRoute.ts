// -----------------------------------------------------------------------------
/**
 * @module composables/useOverlayRoute
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
import type { OverlayType } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

/**
 * Composable for controlling overlay routes (modals/drawers).
 * Watches the current route's matched records for overlay meta
 * and exposes reactive state for rendering the correct overlay.
 *
 * NB: `returnRoute` query param holds a Vue Router **route name** (not a URL path).
 * Funnels set it when redirecting to an overlay, e.g. `returnRoute: ROUTE.CHECKOUT`.
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

  /** Close the overlay and navigate to returnRoute (e.g. after auth success) */
  function close(): void {
    const returnRoute = route.query?.returnRoute as string | undefined;
    if (returnRoute) {
      router.push({ name: returnRoute });
    } else {
      router.back();
    }
  }

  /** Dismiss the overlay (backdrop click) — go back, or fallbackRoute if no history */
  function dismiss(): void {
    if (window.history.state?.back) {
      router.back();
    } else {
      // Prefer explicit fallbackRoute, then parent route, then root
      const fallback = route.query.fallbackRoute as string | undefined;
      const parentRoute = find(
        [...route.matched].reverse(),
        r => !!r.name && !r.meta?.overlay
      );
      router.push({ name: fallback ?? (parentRoute?.name as string) ?? "/" });
    }
  }

  /** Waits for the composable to be ready — resolves immediately (no async init). */
  async function isReady(): Promise<boolean> {
    return Promise.resolve(true);
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    /** Whether an overlay is currently active */
    isOpen,
    /** Whether the composable is ready */
    isReady,
    /** The overlay identifier */
    overlayId,
    /** The overlay render type: 'modal' | 'drawer' */
    overlayType,
    // --- methods
    /** Close the overlay, navigating to returnRoute or router.back() */
    close,
    /** Dismiss the overlay (backdrop), navigating back or to fallbackRoute */
    dismiss
  };
}

export type UseOverlayRoute = ReturnType<typeof useOverlayRoute>;
