/**
 * @module auth-app/routes
 * @description This app's own auth paths. It knows its base is `/`, so the
 * records carry their resolved shape directly rather than a builder's default,
 * and `meta.authReturnTarget` is unconditional: every route here is one the
 * package's flow registrar hands back from.
 */
import {
  UpmAuthLogin,
  UpmAuthLogout,
  UpmAuthRecoverPassword,
  UpmAuthRegister
} from "@upmind-automation/auth";
import type { RouteRecordRaw } from "vue-router";

export const AUTH_ROUTE = {
  ROOT: "auth",
  LOGIN: "auth-login",
  REGISTER: "auth-register",
  RECOVER: "auth-recover",
  END: "auth-end"
} as const;

/** The cross-links every session screen offers, spread in as props. */
const sessionRouteProps = {
  loginRoute: { name: AUTH_ROUTE.LOGIN },
  registerRoute: { name: AUTH_ROUTE.REGISTER },
  recoverRoute: { name: AUTH_ROUTE.RECOVER }
};

const meta = {
  allowOverlays: false,
  authReturnTarget: true
};

export const authRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    name: AUTH_ROUTE.ROOT,
    redirect: { name: AUTH_ROUTE.LOGIN },
    meta,
    children: [
      {
        path: "login",
        name: AUTH_ROUTE.LOGIN,
        component: UpmAuthLogin,
        props: () => sessionRouteProps,
        meta
      },
      {
        path: "register",
        name: AUTH_ROUTE.REGISTER,
        alias: ["signup"],
        component: UpmAuthRegister,
        props: () => sessionRouteProps,
        meta
      },
      {
        path: "recover",
        name: AUTH_ROUTE.RECOVER,
        component: UpmAuthRecoverPassword,
        props: () => sessionRouteProps,
        meta
      },
      {
        path: "logout",
        name: AUTH_ROUTE.END,
        alias: ["signout"],
        component: UpmAuthLogout,
        meta
      }
    ]
  }
];
