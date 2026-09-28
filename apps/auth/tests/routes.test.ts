// -----------------------------------------------------------------------------
/**
 * @fileoverview The auth route records.
 *
 * ## Job To Be Done
 * Every `AUTH_ROUTE` resolves, legacy `signup`/`signout` answer, and the sign-in routes pass the landing on.
 *
 * ## What Breaks If These Fail
 * The app boots to a 404, or leaves a signed-in customer on the login screen.
 */

import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { AUTH_ROUTE, authRoutes } from "../src/routes";

// -----------------------------------------------------------------------------

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

  it("marks the sign-in routes, and not logout", () => {
    const router = routerFor();
    const signIn = [AUTH_ROUTE.LOGIN, AUTH_ROUTE.REGISTER, AUTH_ROUTE.RECOVER];

    for (const name of signIn) {
      expect(router.resolve({ name }).meta.signIn).toBe(true);
    }
    expect(
      router.resolve({ name: AUTH_ROUTE.END }).meta.signIn
    ).toBeUndefined();
  });

  it("hands login and register a landing that keeps the query", () => {
    const router = routerFor();
    const query = { returnUrl: "/basket" };

    for (const name of [AUTH_ROUTE.LOGIN, AUTH_ROUTE.REGISTER]) {
      const route = router.resolve({ name, query });
      const props = route.matched.at(-1)?.props.default;

      expect(typeof props === "function" && props(route)).toMatchObject({
        landingRoute: { name: AUTH_ROUTE.LANDING, query }
      });
    }
  });
});
