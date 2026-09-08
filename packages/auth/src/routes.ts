/**
 * @module auth/routes
 * @description The route records this package contributes through
 * `defineFeature` (ADR 023 §8). Paths are relative to the base a host mounts
 * them under, so the same records serve `/order/{bid}/auth/*` in the cart and
 * `/auth/*` in the standalone shell.
 */
import Login from "./Login.vue";
import Logout from "./Logout.vue";
import RecoverPassword from "./RecoverPassword.vue";
import Register from "./Register.vue";
import type { RouteRecordRaw } from "vue-router";

export const AUTH_ROUTE = {
  ROOT: "auth",
  LOGIN: "auth-login",
  REGISTER: "auth-register",
  RECOVER: "auth-recover",
  END: "auth-end"
} as const;

export type AuthRouteName = (typeof AUTH_ROUTE)[keyof typeof AUTH_ROUTE];

export type AuthRoutesOptions = {
  /** Path the records mount under. Default `/auth`. */
  base?: string;
  /**
   * Marks the records as owning the return-target hand-back. The flow
   * registrar's guard only fires on a route carrying this meta, so a host that
   * drives navigation from its own funnel (cart, cart-nuxt) is untouched.
   */
  returnTarget?: boolean;
};

const sessionRouteProps = {
  loginRoute: { name: AUTH_ROUTE.LOGIN },
  registerRoute: { name: AUTH_ROUTE.REGISTER },
  recoverRoute: { name: AUTH_ROUTE.RECOVER }
};

export function authRoutes(options: AuthRoutesOptions = {}): RouteRecordRaw[] {
  const base = options.base ?? "/auth";
  const meta = {
    allowOverlays: false,
    authReturnTarget: !!options.returnTarget
  };

  return [
    {
      path: base,
      name: AUTH_ROUTE.ROOT,
      redirect: { name: AUTH_ROUTE.LOGIN },
      meta,
      children: [
        {
          path: "login",
          name: AUTH_ROUTE.LOGIN,
          component: Login,
          props: () => sessionRouteProps,
          meta
        },
        {
          path: "register",
          name: AUTH_ROUTE.REGISTER,
          alias: ["signup"],
          component: Register,
          props: () => sessionRouteProps,
          meta
        },
        {
          path: "recover",
          name: AUTH_ROUTE.RECOVER,
          component: RecoverPassword,
          props: () => sessionRouteProps,
          meta
        },
        {
          path: "logout",
          name: AUTH_ROUTE.END,
          alias: ["signout"],
          component: Logout,
          meta
        }
      ]
    }
  ];
}
