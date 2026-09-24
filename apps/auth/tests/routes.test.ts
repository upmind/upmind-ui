// -----------------------------------------------------------------------------
/**
 * @fileoverview The auth route records.
 *
 * ## Job To Be Done
 * Every `AUTH_ROUTE` resolves, legacy `signup`/`signout` answer, and each record carries return meta.
 *
 * ## What Breaks If These Fail
 * The app boots to a 404, or leaves a signed-in customer on the login screen.
 */

import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { AUTH_ROUTE, authRoutes } from "../src/routes";

// -----------------------------------------------------------------------------

const RETURN_TARGET_META = "authReturnTarget";

function routerFor() {
  return createRouter({
    history: createMemoryHistory(),
    routes: authRoutes
  });
}

describe("authRoutes", () => {
  it("mounts every published flow under / by default", () => {
    const router = routerFor();

    expect(router.resolve({ name: AUTH_ROUTE.LOGIN }).path).toBe("/login");
    expect(router.resolve({ name: AUTH_ROUTE.REGISTER }).path).toBe(
      "/register"
    );
    expect(router.resolve({ name: AUTH_ROUTE.RECOVER }).path).toBe("/recover");
    expect(router.resolve({ name: AUTH_ROUTE.END }).path).toBe("/logout");
  });

  it("gives every flow a component to render", () => {
    const router = routerFor();
    const flows = [
      AUTH_ROUTE.LOGIN,
      AUTH_ROUTE.REGISTER,
      AUTH_ROUTE.RECOVER,
      AUTH_ROUTE.END
    ];

    for (const name of flows) {
      const matched = router.resolve({ name }).matched.at(-1);
      expect(matched?.components?.default).toBeTruthy();
    }
  });

  it("sends the root at the login flow", async () => {
    const router = routerFor();

    await router.push({ name: AUTH_ROUTE.ROOT });

    expect(router.currentRoute.value.name).toBe(AUTH_ROUTE.LOGIN);
    expect(router.currentRoute.value.meta).toMatchObject({
      [RETURN_TARGET_META]: true
    });
  });

  it("keeps answering the legacy signup and signout paths", () => {
    const router = routerFor();

    expect(router.resolve("/signup").name).toBe(AUTH_ROUTE.REGISTER);
    expect(router.resolve("/signout").name).toBe(AUTH_ROUTE.END);
  });

  it("mounts the whole set under this app's own base", () => {
    const router = routerFor();

    expect(router.resolve({ name: AUTH_ROUTE.LOGIN }).path).toBe("/login");
    expect(router.resolve({ name: AUTH_ROUTE.END }).path).toBe("/logout");
    expect(router.resolve("/auth/login").matched).toEqual([]);
  });

  it("marks every record, because this app owns the hand-back", () => {
    const router = routerFor();
    const flows = [
      AUTH_ROUTE.ROOT,
      AUTH_ROUTE.LOGIN,
      AUTH_ROUTE.REGISTER,
      AUTH_ROUTE.RECOVER,
      AUTH_ROUTE.END
    ];

    for (const name of flows) {
      expect(router.resolve({ name }).meta).toMatchObject({
        [RETURN_TARGET_META]: true
      });
    }
  });
});
