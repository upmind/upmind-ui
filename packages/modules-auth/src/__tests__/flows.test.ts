// -----------------------------------------------------------------------------
/**
 * @fileoverview The return-target hand-back — ADR 023 Amendment 1 change 4
 *
 * ## Job To Be Done
 * The standalone auth app boots on a return target and hands the visitor back
 * to it the moment a session is minted. `registerAuthFlows` is that hand-back.
 * It has to fire on the authentication itself — not on the next navigation the
 * visitor happens to make — honour only the routes a host opted in, and refuse
 * every target `readReturnTarget` rejects.
 *
 * ## What Breaks If These Fail
 * A customer who signs in to buy is stranded on the login screen with their
 * basket one URL away and no link back to it. With the guard too eager instead,
 * a host that drives its own funnel loses control of its navigation, and a
 * hostile `?returnUrl=` walks the visitor off-origin at the one moment they
 * hold a fresh session.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, h, ref } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { registerAuthFlows } from "../index";
import type { RouteRecordRaw } from "vue-router";

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

/** The route names a host picks; the package publishes none of its own. */
const AUTH_ROUTE = {
  ROOT: "auth",
  LOGIN: "auth-login",
  REGISTER: "auth-register",
  RECOVER: "auth-recover",
  END: "auth-end"
} as const;

/**
 * A host's own auth records, stood up here because the package no longer
 * publishes any. `returnTarget` is the meta the registrar's guard keys on: a
 * host that drives its own funnel omits it and the guard must stay silent.
 */
function hostAuthRoutes(
  options: { returnTarget?: boolean } = {}
): RouteRecordRaw[] {
  const meta = { authReturnTarget: !!options.returnTarget };

  return [
    {
      path: "/auth",
      name: AUTH_ROUTE.ROOT,
      redirect: { name: AUTH_ROUTE.LOGIN },
      meta,
      children: [
        { path: "login", name: AUTH_ROUTE.LOGIN, component: Blank, meta },
        { path: "register", name: AUTH_ROUTE.REGISTER, component: Blank, meta },
        { path: "recover", name: AUTH_ROUTE.RECOVER, component: Blank, meta },
        { path: "logout", name: AUTH_ROUTE.END, component: Blank, meta }
      ]
    }
  ];
}

/** The host's own pages, so a hand-back has somewhere real to land. */
const HOST_ROUTES = [
  { path: "/", name: "home", component: Blank },
  { path: "/basket", name: "basket", component: Blank }
];

function armedRouter(options?: { returnTarget?: boolean }) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [...hostAuthRoutes(options), ...HOST_ROUTES]
  });
  registerAuthFlows(router);
  return router;
}

/** The hand-back watches the session flag, so it lands a tick after the flip. */
async function signIn() {
  isAuthenticated.value = true;
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe("the return-target hand-back", () => {
  beforeEach(() => {
    isAuthenticated.value = false;
  });

  it("hands the visitor back the moment the session is minted", async () => {
    const router = armedRouter({ returnTarget: true });
    await router.push("/auth/login?returnUrl=/basket");

    await signIn();

    expect(router.currentRoute.value.fullPath).toBe("/basket");
  });

  it("hands back from the register and recover screens too", async () => {
    for (const path of ["/auth/register", "/auth/recover"]) {
      isAuthenticated.value = false;
      const router = armedRouter({ returnTarget: true });
      await router.push(`${path}?returnUrl=/basket`);

      await signIn();

      expect(router.currentRoute.value.fullPath).toBe("/basket");
    }
  });

  it("leaves an anonymous visitor on the auth screen", async () => {
    const router = armedRouter({ returnTarget: true });

    await router.push("/auth/login?returnUrl=/basket");

    expect(router.currentRoute.value.fullPath).toBe(
      "/auth/login?returnUrl=/basket"
    );
  });

  it("takes a visitor who already holds a session straight to the target", async () => {
    isAuthenticated.value = true;
    const router = armedRouter({ returnTarget: true });

    await router.push("/auth/login?returnUrl=/basket");

    expect(router.currentRoute.value.fullPath).toBe("/basket");
  });

  it("replaces the auth screen instead of stacking the target on it", async () => {
    const router = armedRouter({ returnTarget: true });
    await router.push("/");
    await router.push("/auth/login?returnUrl=/basket");

    await signIn();
    router.back();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(router.currentRoute.value.fullPath).toBe("/");
  });

  it("leaves the funnel alone when the host never opted in", async () => {
    const router = armedRouter();
    await router.push("/auth/login?returnUrl=/basket");

    await signIn();

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.LOGIN);
  });

  it("refuses a protocol-relative host", async () => {
    const router = armedRouter({ returnTarget: true });
    await router.push("/auth/login?returnUrl=//evil.example");

    await signIn();

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.LOGIN);
  });

  it("refuses a host smuggled behind a backslash", async () => {
    const router = armedRouter({ returnTarget: true });
    await router.push({
      name: AUTH_ROUTE.LOGIN,
      query: { returnUrl: "/\\evil.example" }
    });

    await signIn();

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.LOGIN);
  });

  it("stays put when the query names no target", async () => {
    const router = armedRouter({ returnTarget: true });
    await router.push("/auth/login");

    await signIn();

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.LOGIN);
  });

  it("never hijacks a host route that happens to carry the query", async () => {
    const router = armedRouter({ returnTarget: true });
    await router.push("/?returnUrl=/basket");

    await signIn();

    expect(router.currentRoute.value.fullPath).toBe("/?returnUrl=/basket");
  });
});
