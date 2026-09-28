/**
 * @module auth-app/routes
 * @description This app's own auth paths.
 */
import {
  UpmAuthLogin,
  UpmAuthLogout,
  UpmAuthRecoverPassword,
  UpmAuthRegister
} from "@upmind-automation/auth";
import type { RouteLocationNormalized, RouteRecordRaw } from "vue-router";

export const AUTH_ROUTE = {
  ROOT: "auth",
  LOGIN: "auth-login",
  REGISTER: "auth-register",
  RECOVER: "auth-recover",
  END: "auth-end",
  LANDING: "signed-in"
} as const;

const sessionRouteProps = {
  loginRoute: { name: AUTH_ROUTE.LOGIN },
  registerRoute: { name: AUTH_ROUTE.REGISTER },
  recoverRoute: { name: AUTH_ROUTE.RECOVER }
};

// The landing takes the query, so it can hand the visitor back to `returnUrl`.
function signInRouteProps(route: RouteLocationNormalized) {
  const { loginRoute, registerRoute, recoverRoute } = sessionRouteProps;
  const landingRoute = { name: AUTH_ROUTE.LANDING, query: route.query };

  return { loginRoute, registerRoute, recoverRoute, landingRoute };
}

const meta = {
  allowOverlays: false
};

// `router.ts` sends a signed-in visitor on from these.
const signInMeta = {
  allowOverlays: false,
  signIn: true
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
        props: signInRouteProps,
        meta: signInMeta
      },
      {
        path: "register",
        name: AUTH_ROUTE.REGISTER,
        alias: ["signup"],
        component: UpmAuthRegister,
        props: signInRouteProps,
        meta: signInMeta
      },
      {
        path: "recover",
        name: AUTH_ROUTE.RECOVER,
        component: UpmAuthRecoverPassword,
        props: () => sessionRouteProps,
        meta: signInMeta
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
