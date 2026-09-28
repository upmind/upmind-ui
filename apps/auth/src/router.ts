/**
 * @module auth-app/router
 * @description Mounts the auth organisms on this app's own paths.
 */
import { createRouter, createWebHistory } from "vue-router";
import {
  registerAuthFlows,
  useActiveSession
} from "@upmind-automation/headless";
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
