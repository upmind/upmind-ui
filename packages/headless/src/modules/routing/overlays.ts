// -----------------------------------------------------------------------------
/**
 * @module routing/overlays
 * @description Overlay route system for deep-linkable UI overlays (modals/drawers).
 * Dynamically injects child routes onto eligible parent routes so that navigating
 * to e.g. `/basket/auth/` opens an auth overlay on the basket page.
 */

import { assign } from "xstate";
import { FunnelActions, OverlayType } from "./routing.types";
import { pascalCase } from "./routing.utils";
import { filter, findKey, forEach, isString, keys, reduce } from "lodash-es";
import type {
  FunnelContext,
  FunnelProps,
  FunnelTarget,
  OverlayResponse
} from "./routing.types";
import type { Router, RouteRecordRaw } from "vue-router";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

/** Overlay registry type — maps path suffix to route name */
export type OverlayRegistry = Record<string, string>;

/** Cached route records for overlay components, keyed by route name */
const overlayRouteCache = new Map<string, RouteRecordRaw>();

// -----------------------------------------------------------------------------

/**
 * Generate funnel endpoint state nodes from overlay registry.
 * Each overlay gets a state node for funnel guard evaluation.
 * Guards are handled by the funnel itself via route meta.
 *
 * @param registry - Map of path suffix to route name (e.g. { "auth/": "overlay-auth" })
 * @returns `{ states, guards, actions }` to merge into funnel config
 */
export function createEndpointNodes(
  registry: OverlayRegistry = {},
  funnelStates: Record<string, { invoke?: unknown }> = {}
): NonNullable<FunnelProps["endpoints"]> {
  const overlayIds = keys(registry).map((path: string) =>
    path.replace(/\/$/, "")
  );

  // --- states: endpoint state nodes
  const states = reduce(
    overlayIds,
    (acc: Record<string, unknown>, id: string) => {
      // Honour the overlay's own route guard: reuse the `invoke` from its raw
      // funnel state (e.g. `overlay-verify-email`) so a compound overlay route
      // (`checkout--verify-email`) is gated exactly like the raw route. Falls
      // back to unconditional resolve for overlays whose raw state has no guard.
      const rawState = funnelStates[registry[`${id}/`] ?? registry[id]];
      acc[`endpoint:${id}`] = rawState?.invoke
        ? { meta: { isEndpoint: true, overlayId: id }, invoke: rawState.invoke }
        : { meta: { isEndpoint: true, overlayId: id }, entry: ["setResolved"] };
      return acc;
    },
    {} as Record<string, unknown>
  );

  // --- guards: endsWith matching (e.g. "basket--auth" matches endpoint:auth)
  const guards = reduce(
    overlayIds,
    (acc: NonNullable<FunnelProps["guards"]>, id: string) => {
      acc[`isEndpoint${pascalCase(id)}`] = (
        { targetRoute }: FunnelContext,
        { data }: AnyEventObject
      ) => {
        const target =
          (isString(data?.target) ? { name: data.target } : data?.target) ??
          targetRoute;
        return !!target?.name?.toString().endsWith(`--${id}`);
      };
      return acc;
    },
    {} as NonNullable<FunnelProps["guards"]>
  );

  // --- isOverlay guard: true when a guard resolved/rejected with an overlay payload
  guards.isOverlay = (_context: FunnelContext, { data }: AnyEventObject) =>
    data?.type === FunnelActions.OVERLAY;

  // --- actions: resolveToParent strips the overlay suffix and redirects
  const actions: FunnelProps["actions"] = {
    resolveToParent: assign({
      resolved: true,
      targetRoute: ({ currentRoute, targetRoute }: FunnelContext) => {
        const route = targetRoute ?? currentRoute;
        const name = route?.name?.toString() ?? "";
        const parentName = name.replace(/--[^-]+$/, "");
        return { ...route, name: parentName || route?.name || undefined };
      }
    }),

    // setOverlay turns an OverlayResponse into a `{base}--{overlayId}` target so
    // the overlay renders over the given base route. The overlay id is looked up
    // in the registry (path keyed by route name), stripped of its trailing slash,
    // matching the `--{id}` suffix createEndpointNodes/registerOverlayRoutes derive.
    setOverlay: assign({
      targetRoute: (
        { currentRoute }: FunnelContext,
        { data }: AnyEventObject
      ): FunnelTarget => {
        const { target, overlay } = data as OverlayResponse;
        const overlayId = findKey(
          registry,
          (routeName: string) => routeName === overlay
        )?.replace(/\/$/, "");
        return {
          ...target,
          name: overlayId
            ? `${String(target?.name)}--${overlayId}`
            : (overlay ?? target?.name ?? currentRoute?.name ?? undefined)
        } as FunnelTarget;
      }
    })
  };

  return { actions, guards, states };
}

// -----------------------------------------------------------------------------

/**
 * Inject overlay child routes onto all eligible parent routes.
 * Looks up each overlay by route name in vue-router and injects it
 * as a child on eligible parent routes.
 *
 * @param router - Vue Router instance
 * @param registry - Map of path suffix to route name (e.g. { "auth/": "overlay-auth" })
 *
 * @example
 * // With this registry:
 * registerOverlayRoutes(router, { "auth/": "overlay-auth" });
 *
 * // These routes become available:
 * // /basket/auth/ → renders overlay-auth component
 * // /checkout/auth/ → renders overlay-auth component
 */
export function registerOverlayRoutes(
  router: Router,
  registry: OverlayRegistry = {}
): void {
  // Build cache of overlay route records
  forEach(registry, (routeName: string, _path: string) => {
    if (overlayRouteCache.has(routeName)) return;
    const route = router
      .getRoutes()
      .find((r: RouteRecordRaw) => r.name === routeName);
    if (route) {
      overlayRouteCache.set(routeName, route);
    }
  });

  // Get eligible parent routes
  const parentRoutes = filter(
    router.getRoutes(),
    r =>
      !!r.name &&
      r.meta?.allowOverlays !== false &&
      !r.meta?.overlay &&
      !String(r.name).startsWith("overlay")
  );

  // Inject overlays as children on each eligible parent
  for (const parent of parentRoutes) {
    forEach(registry, (routeName: string, path: string) => {
      const overlayId = path.replace(/\/$/, "");
      const childName = `${String(parent.name)}--${overlayId}`;

      if (router.hasRoute(childName)) return;

      const overlayRoute = overlayRouteCache.get(routeName);
      if (!overlayRoute) return;

      const component = overlayRoute.components?.default;
      if (!component) return;

      router.addRoute(parent.name!, {
        path,
        name: childName,
        component,
        meta: {
          ...overlayRoute.meta,
          overlay: overlayRoute.meta?.overlay ?? OverlayType.MODAL,
          overlayId
        }
      });
    });
  }
}

// -----------------------------------------------------------------------------

/**
 * Get the cached overlay route record by route name.
 * Used by OverlayController to resolve components.
 *
 * @param routeName - The overlay route name (e.g. "overlay-auth")
 * @returns The route record, or undefined if not cached
 */
export function getOverlayRoute(routeName: string): RouteRecordRaw | undefined {
  return overlayRouteCache.get(routeName);
}

/**
 * Get the overlay route name from the registry by path suffix.
 *
 * @param registry - The overlay registry
 * @param path - The path suffix (e.g. "auth/")
 * @returns The route name, or undefined if not found
 */
export function getOverlayRouteName(
  registry: OverlayRegistry,
  path: string
): string | undefined {
  return registry[path] ?? registry[`${path}/`];
}
