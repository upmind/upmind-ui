// -----------------------------------------------------------------------------
/**
 * @fileoverview The post-login landing.
 *
 * ## Job To Be Done
 * The `fallback` loses to a real target, fires with none, and is reached when the target is refused.
 *
 * ## What Breaks If These Fail
 * A signed-in visitor stays on login, or a buying customer lands on a landing, not the basket.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, h, ref } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { AUTH_QUERY, registerAuthFlows } from "../index";
import type { AuthFlowOptions } from "../index";
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

const AUTH_ROUTE = {
  ROOT: "auth",
  LOGIN: "auth-login",
  REGISTER: "auth-register",
  RECOVER: "auth-recover",
  END: "auth-end"
} as const;

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

const HOST_ROUTES = [
  { path: "/", name: "home", component: Blank },
  { path: "/basket", name: "basket", component: Blank },
  { path: "/signed-in", name: "signed-in", component: Blank }
];

const LANDING = "/signed-in";
const LANDING_NAME = "signed-in";

function armedRouter(
  routes?: { returnTarget?: boolean },
  flows?: AuthFlowOptions
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [...hostAuthRoutes(routes), ...HOST_ROUTES]
  });
  registerAuthFlows(router, flows);
  return router;
}

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
    const router = armedRouter({}, { fallback: LANDING });
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
