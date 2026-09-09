// -----------------------------------------------------------------------------
/**
 * @fileoverview The post-login landing — ADR 023 Amendment 1 change 4
 *
 * ## Job To Be Done
 * The hand-back only has a destination while the query carries one. A visitor
 * who reaches the standalone app with no return target still ends up holding a
 * session, so `registerAuthFlows`' `fallback` is the somewhere they land. It has
 * to lose to a real target, fire when there is none, and be reachable when the
 * target was REFUSED — a refusal is not an absence, and the two must arrive
 * distinguishable so the landing can say which happened.
 *
 * ## What Breaks If These Fail
 * The visitor signs in and stays on the login screen, now signed in, with the
 * form still asking for the credentials they just gave — the dead end the
 * fallback exists to remove. With the fallback winning over a real target
 * instead, every customer who signs in to buy is dropped on a landing page
 * rather than their basket.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, h, ref } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import {
  AUTH_QUERY,
  AUTH_ROUTE,
  authRoutes,
  registerAuthFlows
} from "../index";
import type { AuthFlowOptions, AuthRoutesOptions } from "../index";

// -----------------------------------------------------------------------------

const isAuthenticated = ref(false);

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useActiveSession: () => ({
      useActions: () => ({}),
      useContext: () => ({}),
      useInternals: () => ({}),
      useMeta: () => ({
        isAuthenticated: computed(() => isAuthenticated.value)
      })
    })
  };
});

const Blank = { setup: () => () => h("div") };

/** The host's own pages, including the one it nominates as the landing. */
const HOST_ROUTES = [
  { path: "/", name: "home", component: Blank },
  { path: "/basket", name: "basket", component: Blank },
  { path: "/signed-in", name: "signed-in", component: Blank }
];

/** The flow takes the fallback as a PATH, so a host names its landing by path. */
const LANDING = "/signed-in";
const LANDING_NAME = "signed-in";

function armedRouter(routes?: AuthRoutesOptions, flows?: AuthFlowOptions) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [...authRoutes(routes), ...HOST_ROUTES]
  });
  registerAuthFlows(router, flows);
  return router;
}

/** The hand-back watches the session flag, so it lands a tick after the flip. */
async function signIn() {
  isAuthenticated.value = true;
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe("the post-login landing", () => {
  beforeEach(() => {
    isAuthenticated.value = false;
  });

  it("lands the visitor on the fallback when the query names no target", async () => {
    const router = armedRouter({ returnTarget: true }, { fallback: LANDING });
    await router.push("/auth/login");

    await signIn();

    expect(router.currentRoute.value.name).toBe(LANDING_NAME);
  });

  it("loses to a real return target", async () => {
    const router = armedRouter({ returnTarget: true }, { fallback: LANDING });
    await router.push("/auth/login?returnUrl=/basket");

    await signIn();

    expect(router.currentRoute.value.fullPath).toBe("/basket");
  });

  it("leaves the visitor where they are when the host names no fallback", async () => {
    const router = armedRouter({ returnTarget: true });
    await router.push("/auth/login");

    await signIn();

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.LOGIN);
  });

  it("tells the landing a target was refused, not merely absent", async () => {
    const router = armedRouter({ returnTarget: true }, { fallback: LANDING });
    await router.push("/auth/login?returnUrl=//evil.example");

    await signIn();

    expect(router.currentRoute.value.name).toBe(LANDING_NAME);
    expect(router.currentRoute.value.query).toHaveProperty(
      AUTH_QUERY.RETURN_REFUSED
    );
  });

  it("says nothing about a refusal when the query named no target", async () => {
    const router = armedRouter({ returnTarget: true }, { fallback: LANDING });
    await router.push("/auth/login");

    await signIn();

    expect(router.currentRoute.value.name).toBe(LANDING_NAME);
    expect(router.currentRoute.value.query).not.toHaveProperty(
      AUTH_QUERY.RETURN_REFUSED
    );
  });

  it("refuses a backslash-smuggled host to the landing, not to the host", async () => {
    const router = armedRouter({ returnTarget: true }, { fallback: LANDING });
    await router.push({
      name: AUTH_ROUTE.LOGIN,
      query: { returnUrl: "/\\evil.example" }
    });

    await signIn();

    expect(router.currentRoute.value.name).toBe(LANDING_NAME);
    expect(router.currentRoute.value.query).toHaveProperty(
      AUTH_QUERY.RETURN_REFUSED
    );
  });

  it("leaves an anonymous visitor on the auth screen", async () => {
    const router = armedRouter({ returnTarget: true }, { fallback: LANDING });

    await router.push("/auth/login");

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.LOGIN);
  });

  it("never hijacks a host route that carries no auth opt-in", async () => {
    const router = armedRouter({ returnTarget: true }, { fallback: LANDING });
    await router.push("/");

    await signIn();

    expect(router.currentRoute.value.name).toBe("home");
  });

  it("leaves the funnel alone when the host never opted the routes in", async () => {
    const router = armedRouter(undefined, { fallback: LANDING });
    await router.push("/auth/login");

    await signIn();

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.LOGIN);
  });

  it("replaces the auth screen instead of stacking the landing on it", async () => {
    const router = armedRouter({ returnTarget: true }, { fallback: LANDING });
    await router.push("/");
    await router.push("/auth/login");

    await signIn();
    router.back();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(router.currentRoute.value.name).toBe("home");
  });
});
