/**
 * @module auth-app/routes
 * @description This app's own auth paths.
 */
import { UpmAuthLogout } from "@upmind-automation/auth";
// `./router` imports this file; headless holds the same router instance.
import { router } from "@upmind-automation/headless";
import Login from "./pages/Login.vue";
import Recover from "./pages/Recover.vue";
import Register from "./pages/Register.vue";
import type { RouteRecordRaw } from "vue-router";
// -----------------------------------------------------------------------------

export const AUTH_ROUTE = {
  ROOT: "auth",
  LOGIN: "auth-login",
  REGISTER: "auth-register",
  RECOVER: "auth-recover",
  END: "auth-end",
  LANDING: "signed-in"
} as const;

const authRouteProps = {
  loginRoute: { name: AUTH_ROUTE.LOGIN },
  registerRoute: { name: AUTH_ROUTE.REGISTER },
  recoverRoute: { name: AUTH_ROUTE.RECOVER }
};

const { loginRoute, registerRoute, recoverRoute } = authRouteProps;

// No funnel runs here, so this listener is the recovery page's only way back to login.
const recoverRouteProps = {
  loginRoute,
  registerRoute,
  recoverRoute,
  onReject: () => router.push(loginRoute)
};

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
        component: Login,
        props: authRouteProps,
        meta: signInMeta
      },
      {
        path: "register",
        name: AUTH_ROUTE.REGISTER,
        alias: ["signup"],
        component: Register,
        props: authRouteProps,
        meta: signInMeta
      },
      {
        path: "recover",
        name: AUTH_ROUTE.RECOVER,
        component: Recover,
        props: recoverRouteProps,
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
