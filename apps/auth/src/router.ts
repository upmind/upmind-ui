/**
 * @module auth-app/router
 * @description Mounts the auth organisms on this app's own paths.
 */
import { createRouter, createWebHistory } from "vue-router";
import { QUERY_PARAMS, useActiveSession } from "@upmind-automation/headless";
import { AUTH_ROUTE, authRoutes } from "./routes";
import SignedIn from "./SignedIn.vue";
import type { RouteLocationNormalized } from "vue-router";

async function isSignedIn() {
  const session = useActiveSession();
  // The session hydrates asynchronously; before this a signed-in visitor reads as signed out.
  await session.useActions().isReady();

  return session.useMeta().isAuthenticated.value;
}

// The router keeps every target on this origin, so `returnUrl` needs no origin check.
async function handBack(to: RouteLocationNormalized) {
  if (!(await isSignedIn())) return { name: AUTH_ROUTE.LOGIN, query: to.query };

  const returnUrl = to.query[QUERY_PARAMS.RETURN_URL]?.toString();
  if (returnUrl) return returnUrl;

  return true;
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    {
      path: "/signed-in",
      name: AUTH_ROUTE.LANDING,
      component: SignedIn,
      beforeEnter: handBack
    },
    { path: "/:pathMatch(.*)*", redirect: { name: AUTH_ROUTE.LOGIN } }
  ]
});

router.beforeEach(async to => {
  if (to.meta.signIn && (await isSignedIn()))
    return { name: AUTH_ROUTE.LANDING, query: to.query };

  return true;
});

export default router;
