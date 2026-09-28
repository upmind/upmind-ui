// -----------------------------------------------------------------------------
/**
 * @fileoverview The app's hand-back to `returnUrl`.
 *
 * ## Job To Be Done
 * A signed-in visitor goes on to `returnUrl`, or stays on the landing; no `returnUrl` leaves this origin.
 *
 * ## What Breaks If These Fail
 * A signed-in visitor keeps a sign-in form, or a crafted link sends them to another site.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import router from "../src/router";
import { AUTH_ROUTE } from "../src/routes";

// -----------------------------------------------------------------------------

const { isAuthenticated } = vi.hoisted(() => ({
  isAuthenticated: { value: false }
}));

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useActiveSession: () => ({
      useActions: () => ({ isReady: () => Promise.resolve(true) }),
      useMeta: () => ({ isAuthenticated })
    })
  };
});

const HOSTILE = [
  "https://evil.example/basket",
  "//evil.example",
  "/\\evil.example",
  "/\t/evil.example",
  "javascript:alert(1)"
];

beforeEach(async () => {
  isAuthenticated.value = false;
  await router.replace({ name: AUTH_ROUTE.LOGIN });
});

describe("router", () => {
  it("sends a signed-in visitor on to returnUrl", async () => {
    isAuthenticated.value = true;

    await router.push({
      name: AUTH_ROUTE.LANDING,
      query: { returnUrl: "/logout" }
    });

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.END);
  });

  it("keeps a signed-in visitor with no returnUrl on the landing", async () => {
    isAuthenticated.value = true;

    await router.push({ name: AUTH_ROUTE.LANDING });

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.LANDING);
  });

  it("takes a signed-in visitor off a sign-in route, keeping returnUrl", async () => {
    isAuthenticated.value = true;

    await router.push({
      name: AUTH_ROUTE.REGISTER,
      query: { returnUrl: "/logout" }
    });

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.END);
  });

  it("sends a signed-out visitor from the landing to login, keeping returnUrl", async () => {
    await router.push({
      name: AUTH_ROUTE.LANDING,
      query: { returnUrl: "/logout" }
    });

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.LOGIN);
    expect(router.currentRoute.value.query).toEqual({ returnUrl: "/logout" });
  });

  it.each(HOSTILE)("lands %j on this app's own landing", async returnUrl => {
    // Start off the login route, or the redirect through it ends as a duplicate and never writes history.
    await router.replace({ name: AUTH_ROUTE.END });
    isAuthenticated.value = true;

    await router.push({ name: AUTH_ROUTE.LANDING, query: { returnUrl } });

    expect(window.location.href).toBe(`${window.location.origin}/signed-in`);
  });
});
