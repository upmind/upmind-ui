// -----------------------------------------------------------------------------
/**
 * @fileoverview The auth route records — ADR 023 §8 route contribution
 *
 * ## Job To Be Done
 * `authRoutes` is how a host mounts the login/register/2FA/recover flows. Every
 * published `AUTH_ROUTE` name must resolve in a real router, under the base the
 * host asked for, with the legacy `signup`/`signout` paths still answering — and
 * the return-target meta the flow registrar keys on must be opt-in.
 *
 * ## What Breaks If These Fail
 * The standalone app boots to a 404 instead of a login screen, or a host that
 * drives navigation from its own funnel (cart, cart-nuxt) silently acquires the
 * hand-back guard and loses control of where a signed-in customer lands.
 */

import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { AUTH_ROUTE, authRoutes } from "../index";
import type { AuthRoutesOptions } from "../index";

// -----------------------------------------------------------------------------

/** The meta flag the flow registrar's guard keys on. */
const RETURN_TARGET_META = "authReturnTarget";

function routerFor(options?: AuthRoutesOptions) {
  return createRouter({
    history: createMemoryHistory(),
    routes: authRoutes(options)
  });
}

describe("authRoutes", () => {
  it("mounts every published flow under /auth by default", () => {
    const router = routerFor();

    expect(router.resolve({ name: AUTH_ROUTE.LOGIN }).path).toBe("/auth/login");
    expect(router.resolve({ name: AUTH_ROUTE.REGISTER }).path).toBe(
      "/auth/register"
    );
    expect(router.resolve({ name: AUTH_ROUTE.RECOVER }).path).toBe(
      "/auth/recover"
    );
    expect(router.resolve({ name: AUTH_ROUTE.END }).path).toBe("/auth/logout");
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
  });

  it("keeps answering the legacy signup and signout paths", () => {
    const router = routerFor();

    expect(router.resolve("/auth/signup").name).toBe(AUTH_ROUTE.REGISTER);
    expect(router.resolve("/auth/signout").name).toBe(AUTH_ROUTE.END);
  });

  it("mounts the whole set under a host's own base", () => {
    const router = routerFor({ base: "/account" });

    expect(router.resolve({ name: AUTH_ROUTE.LOGIN }).path).toBe(
      "/account/login"
    );
    expect(router.resolve({ name: AUTH_ROUTE.END }).path).toBe(
      "/account/logout"
    );
    expect(router.resolve("/auth/login").matched).toEqual([]);
  });

  it("withholds the return-target meta unless the host asks for it", () => {
    const router = routerFor();

    expect(router.resolve({ name: AUTH_ROUTE.LOGIN }).meta).toMatchObject({
      [RETURN_TARGET_META]: false
    });
  });

  it("marks every record when the host owns the hand-back", () => {
    const router = routerFor({ returnTarget: true });
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
