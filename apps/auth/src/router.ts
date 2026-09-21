/**
 * @module auth-app/router
 * @description This app owns its auth paths (`./routes`) and mounts the
 * package's organisms on them. It declares the post-login landing itself, then
 * arms the package's own flow: an authenticated visitor on one of these routes
 * is handed back to `?returnUrl=`, or to the landing when it named no usable
 * target — this app has no funnel to move them on.
 */
import { createRouter, createWebHistory } from "vue-router";
import { registerAuthFlows } from "@upmind-automation/auth";
import { useActiveSession } from "@upmind-automation/headless";
import { AUTH_ROUTE, authRoutes } from "./routes";
import SignedIn from "./SignedIn.vue";

export const LANDING_ROUTE = {
  name: "signed-in",
  path: "/signed-in"
} as const;

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    {
      path: LANDING_ROUTE.path,
      name: LANDING_ROUTE.name,
      component: SignedIn,
      // Nobody reaches the landing except by the hand-back. Typed straight in
      // — or refreshed before the session restores — it would tell a visitor
      // they are signed in when they are not, so it sends them to log in; the
      // hand-back returns them here the moment a session exists.
      beforeEnter: () => {
        const { isAuthenticated } = useActiveSession().useMeta();

        if (!isAuthenticated.value) return { name: AUTH_ROUTE.LOGIN };

        return true;
      }
    },
    { path: "/:pathMatch(.*)*", redirect: { name: AUTH_ROUTE.LOGIN } }
  ]
});

registerAuthFlows(router, { fallback: LANDING_ROUTE.path });

export default router;
