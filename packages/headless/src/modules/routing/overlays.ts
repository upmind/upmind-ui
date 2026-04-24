// -----------------------------------------------------------------------------
/**
 * @module routing/overlays
 * @description Overlay route system for deep-linkable UI overlays (modals/drawers).
 * Dynamically injects child routes onto eligible parent routes so that navigating
 * to e.g. `/basket/auth` opens an auth overlay on the basket page.
 */

// --- external
import { defineComponent } from "vue";
import { assign } from "xstate";
import { filter, reduce, isString } from "lodash-es";

// --- utils
import { pascalCase } from "./utils";

// --- types
import type { Router } from "vue-router";
import type { AnyEventObject } from "xstate";
import type { FunnelContext, OverlayDefinition } from "./types";
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
  {
    path: "auth",
    id: "auth",
    defaultType: OverlayType.MODAL,
    guard: "guardSession"
  },
  {
    path: "2fa",
    id: "2fa",
    defaultType: OverlayType.MODAL,
    guard: "guardSession"
  },
  {
    path: "verify-email",
    id: "verify-email",
    defaultType: OverlayType.MODAL,
    guard: "guardSession"
  }
];

// -----------------------------------------------------------------------------

/**
 * Generate funnel endpoint state nodes from overlay definitions.
 * Each guarded overlay gets a state node that invokes its guard service:
 * - **onDone** (guard passes, e.g. user IS authenticated) → redirect to parent route
 * - **onError** (guard fails, e.g. user NOT authenticated) → resolve normally, overlay renders
 *
 * @returns `{ states, guards, actions }` to merge into funnel config
 */
export function createEndpointNodes(overlays: OverlayDefinition[]) {
  const guarded = filter(
    overlays,
    (ep): ep is OverlayDefinition & { guard: string } => !!ep.guard
  );

  // --- states: endpoint state nodes with guard invocations
  const states = reduce(
    guarded,
    (acc: Record<string, unknown>, ep) => {
      acc[`endpoint:${ep.id}`] = {
        meta: { isEndpoint: true, overlayId: ep.id },
        invoke: {
          src: ep.guard,
          onDone: { actions: ["resolveToParent"] },
          onError: { actions: ["setResolved"] }
        }
      };
      return acc;
    },
    {} as Record<string, unknown>
  );

  // --- guards: endsWith matching (e.g. "basket--auth" matches endpoint:auth)
  const guards = reduce(
    guarded,
    (acc: Record<string, any>, ep) => {
      acc[`isEndpoint${pascalCase(ep.id)}`] = (
        { targetRoute }: FunnelContext,
        { data }: AnyEventObject
      ) => {
        const target =
          (isString(data?.target) ? { name: data.target } : data?.target) ??
          targetRoute;
        return !!target?.name?.toString().endsWith(`--${ep.id}`);
      };
      return acc;
    },
    {} as Record<string, any>
  );

  // --- actions: resolveToParent strips the overlay suffix and redirects
  const actions = {
    resolveToParent: assign({
      resolved: true,
      targetRoute: ({ currentRoute, targetRoute }: FunnelContext) => {
        const route = targetRoute ?? currentRoute;
        const name = route?.name?.toString() ?? "";
        // NB: Strips the last `--{id}` suffix. Safe because overlay route names
        // use `parentName--overlayId` convention. Standard routes use single hyphens.
        const parentName = name.replace(/--[^-]+$/, "");
        return { ...route, name: parentName || route?.name || undefined };
      }
    })
  };

  return { states, guards, actions };
}

// -----------------------------------------------------------------------------

/** Stub — overlays are rendered by the layout, not by <router-view> */
const OverlayStub = defineComponent({ render: () => null });

/**
 * Inject global overlay child routes into all eligible parent routes.
 * Call at app startup, after all routes are registered.
 * Safe to call multiple times — skips routes already registered.
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
      const routeName = `${String(route.name)}--${overlay.id}`;
      if (router.hasRoute(routeName)) continue; // idempotent — skip if already registered
      router.addRoute(route.name!, {
        path: overlay.path,
        name: routeName,
        component: OverlayStub,
        meta: {
          overlay: overlay.defaultType,
          overlayId: overlay.id
        }
      });
    }
  }
}
