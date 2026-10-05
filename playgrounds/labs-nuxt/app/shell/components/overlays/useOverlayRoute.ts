// -----------------------------------------------------------------------------
/**
 * @module composables/useOverlayRoute
 * @description Composable for controlling overlay routes (modals/drawers)
 * triggered by named route endpoints. Watches the current route's matched
 * records for overlay meta and exposes reactive state + close() method.
 */

import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQueryParams, QUERY_PARAMS } from "@upmind-automation/headless";
import { find } from "lodash-es";
import type { OverlayType } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

/**
 * Composable for controlling overlay routes (modals/drawers).
 * Watches the current route's matched records for overlay meta
 * and exposes reactive state for rendering the correct overlay.
 *
 * NB: `returnUrl` query param holds a Vue Router **route name** (not a URL path).
 * Funnels set it when redirecting to an overlay, e.g. `returnUrl: ROUTE.CHECKOUT`.
 */
export function useOverlayRoute() {
  const route = useRoute();
  const router = useRouter();
  const { getParam } = useQueryParams();

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

  // --- private

  /**
   * Resolves the parent route — the nearest matched non-overlay ancestor.
   * Used by both close() and dismiss() to navigate away from the overlay.
   */
  function resolveParentRoute() {
    const parent = find(
      [...route.matched].reverse(),
      r => !!r.name && !r.meta?.overlay
    );
    return parent
      ? { name: parent.name as string, params: route.params }
      : { path: "/" };
  }

  // --- methods

  /**
   * Close the overlay after a flow completes (e.g. auth success).
   * Navigates to `returnUrl` if provided by the funnel, otherwise
   * replaces the current URL with the parent route (strips overlay segment).
   * Uses replace() to keep browser history clean — no stale overlay routes.
   */
  function close(): void {
    const returnUrl = getParam(QUERY_PARAMS.RETURN_URL);
    if (returnUrl) {
      router.replace(returnUrl);
    } else {
      router.replace(resolveParentRoute());
    }
  }

  /**
   * Dismiss the overlay (close control, ESC, backdrop) — to the funnel's own
   * cancel landing, else back, else the parent route.
   *
   * `cancelUrl` is read off the LIVE route and it goes FIRST. Both were bugs:
   * `useQueryParams()` snapshots `router.currentRoute` at call time and this
   * composable is set up once in the app shell, so what it read was the route
   * the app BOOTED on and no overlay's own cancel landing ever reached here;
   * and history-first sent a guarded page's overlay back into the guard that
   * opened it, which re-targets the overlay — so the close control, ESC and the
   * backdrop all appeared to do nothing at all. A funnel that names where
   * cancelling lands has said something the history stack cannot.
   */
  function dismiss(): void {
    const cancelUrl = useQueryParams(route).getParam(QUERY_PARAMS.CANCEL_URL);

    if (cancelUrl) router.push({ name: cancelUrl });
    else if (window.history.state?.back) router.back();
    else router.push(resolveParentRoute());
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
    /** Close the overlay, navigating to returnUrl or router.back() */
    close,
    /** Dismiss the overlay (backdrop), navigating back or to cancelUrl */
    dismiss
  };
}

export type UseOverlayRoute = ReturnType<typeof useOverlayRoute>;
