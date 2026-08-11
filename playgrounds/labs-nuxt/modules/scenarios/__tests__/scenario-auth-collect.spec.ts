// -----------------------------------------------------------------------------
/**
 * @fileoverview @G6 a guarded scenario COLLECTS auth in place (D2 · the C4 ask).
 *
 * ## Job To Be Done
 * An unauthenticated visitor to a client- or staff-scoped scenario sat on
 * skeletons that never settled: the composable had nothing to read and nothing
 * asked for a session. The ruling is the cart's own pattern, not an invention —
 * the route funnel rejects toward SESSION and re-targets the page to its OWN
 * auth overlay (`<route>--auth`), which the shared `OverlayController` draws over
 * whatever is underneath.
 *
 * Three things have to agree or the page still hangs: EVERY scenario route is
 * gated, the name the funnel re-targets to is the name the overlay registry
 * injects, and that name resolves to a real route. This joins them — the REAL
 * declarations, the REAL registrar, the REAL funnel and the REAL injector.
 *
 * ## What is NOT claimed here
 * That the overlay's component is `pages/overlays/auth.vue` — Nuxt's page scan
 * attaches that, and vitest boots no Nuxt. What is proven is the injection and
 * the agreement; the overlay route below is registered under the app's own
 * `ROUTE.OVERLAY_AUTH` name and `OverlayType.MODAL` meta, never a made-up one.
 *
 * ## What Breaks If These Fail
 * The endless-skeleton page comes back, or the funnel re-targets a route name
 * nobody registered and the guard becomes a dead end instead of a login.
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import * as vue from "vue";
import { defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { SESSION_FORMS } from "@upmind-automation/client-vue";
import {
  FunnelActions,
  OverlayType,
  QUERY_PARAMS,
  registerOverlayRoutes,
  ScopeActorTypes
} from "@upmind-automation/headless";
import { LABS_OVERLAYS, ROUTE } from "../../../app/funnels";
import services from "../../../app/funnels/engine/services";
import labs from "../../../app/funnels/labs";
import routerOptions from "../../../app/router.options";
import { scenarioRoutes } from "../runtime/registry";
import { registerScenarioRoutes } from "./nuxt-build-context";
import { first, forEach, get, keys, map } from "lodash-es";
import type { Router } from "vue-router";

// -----------------------------------------------------------------------------

/** Nuxt's auto-imports are globals to a bare vitest module graph. */
forEach(vue, (value, key) => vi.stubGlobal(key, value));

const blank = defineComponent({ render: () => h("div") });

/** The overlay suffix the registry declares — the one segment both sides key off. */
const OVERLAY_ID = first(keys(LABS_OVERLAYS)) as string;

const SCENARIO_ROUTES = keys(scenarioRoutes);

/** The registrar walks the module tree; give the hook the lane's own budget. */
const HOOK_TIMEOUT = 30000;

let router: Router;

/** The guarded state the funnel grew for one scenario route. */
const stateFor = (route: string) => get(labs.states, route);

/** The re-target the rejection assigns, evaluated over the page it was taken on. */
function targetOf(route: string) {
  const rejection = get(stateFor(route), ["invoke", "onError", 0]);
  const assign = get(rejection, ["actions", 1]);
  const assignment = get(assign, ["assignment", "targetRoute"]) as (
    context: Record<string, unknown>
  ) => Record<string, unknown>;

  return assignment({ currentRoute: { name: route, params: {} } });
}

beforeAll(async () => {
  const { pages } = await registerScenarioRoutes();

  router = createRouter({
    history: createMemoryHistory(),
    routes: routerOptions.routes([
      { path: "/", name: ROUTE.HOME, component: blank },
      // The app's own overlay page, by the name and the meta it declares.
      {
        path: "/overlays/auth",
        name: ROUTE.OVERLAY_AUTH,
        component: blank,
        meta: { overlay: OverlayType.MODAL }
      },
      ...map(pages, page => ({ ...page, component: blank }))
    ]) as never
  });
  await router.push("/");
  await router.isReady();

  registerOverlayRoutes(router, LABS_OVERLAYS);
}, HOOK_TIMEOUT);

// -----------------------------------------------------------------------------

describe("@G6 every scenario route is gated (D2)", () => {
  it("grows one guarded state per registered scenario, none hand-listed", () => {
    expect(SCENARIO_ROUTES.length).toBeGreaterThan(0);

    for (const route of SCENARIO_ROUTES)
      expect(get(stateFor(route), ["invoke", "src"])).toBe("guardScenario");
  });

  it("rejects toward the session rather than leaving the page to load forever", () => {
    for (const route of SCENARIO_ROUTES)
      expect(get(stateFor(route), ["invoke", "onError", 0, "target"])).toBe(
        ROUTE.SESSION_LOGIN
      );
  });
});

describe("@G6 the rejection collects auth OVER the page it was taken on (D2)", () => {
  it("re-targets the page's own auth overlay, never a separate login page", () => {
    for (const route of SCENARIO_ROUTES)
      expect(get(targetOf(route), "name")).toBe(`${route}--${OVERLAY_ID}`);
  });

  it("opens on the login form and leaves a way back out", () => {
    const target = targetOf(SCENARIO_ROUTES[0]);

    expect(get(target, ["query", "mode"])).toBe(SESSION_FORMS.LOGIN);
    expect(get(target, ["query", QUERY_PARAMS.CANCEL_URL])).toBe(ROUTE.HOME);
  });
});

describe("@G6 the overlay the funnel names is MOUNTED on that page (D2)", () => {
  it("injects it onto every scenario page the registrar registered", () => {
    for (const route of SCENARIO_ROUTES)
      expect(router.hasRoute(`${route}--${OVERLAY_ID}`)).toBe(true);
  });

  it("resolves it as a child of the page, so the page stays underneath", () => {
    for (const route of SCENARIO_ROUTES) {
      const resolved = router.resolve({
        name: `${route}--${OVERLAY_ID}`,
        params: { scopeSuffix: ["as", ScopeActorTypes.CLIENT] }
      });

      expect(map(resolved.matched, "name")).toContain(route);
      expect(get(resolved.meta, "overlay")).toBe(OverlayType.MODAL);
    }
  });
});

describe("@G6 the gate asks for a session only where the scope needs one (D2)", () => {
  it("lets a GUEST-scoped url through without touching the session at all", async () => {
    const route = SCENARIO_ROUTES[0];

    const verdict = await services.guardScenario({
      targetRoute: {
        name: route,
        params: { scopeSuffix: ["as", ScopeActorTypes.GUEST] }
      }
    } as never);

    expect(verdict.type).toBe(FunnelActions.NEXT);
  });

  it("leaves a non-scenario route alone", async () => {
    const verdict = await services.guardScenario({
      targetRoute: { name: ROUTE.HOME, params: {} }
    } as never);

    expect(verdict.type).toBe(FunnelActions.NEXT);
  });
});
