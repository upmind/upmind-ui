/**
 * @module auth-app/router
 * @description Every auth route on this app comes from the `auth` package's own
 * `defineFeature` contribution (ADR 023 §8), read back through `foundation`'s
 * route registry. The app declares only the post-login landing the package
 * hands back to, which is app-owned shell (Amendment 1 change 3) — that is what
 * makes this a decoupling proof rather than a second implementation.
 */
import { createRouter, createWebHistory } from "vue-router";
import { AUTH_ROUTE, defineAuthFeature } from "@upmind-automation/auth";
import { useFeatures, useRouting } from "@upmind-automation/foundation";
import { useActiveSession } from "@upmind-automation/headless";
import SignedIn from "./SignedIn.vue";

export const LANDING_ROUTE = {
  name: "signed-in",
  path: "/signed-in"
} as const;

const features = useFeatures();

// `returnTarget: true` arms the package's own flow: an authenticated visitor on
// one of these routes is handed back to `?returnUrl=`, or to the landing below
// when it named no usable target — this app has no funnel to move them on.
features.register(
  defineAuthFeature({
    base: "/",
    returnTarget: true,
    fallback: LANDING_ROUTE.path
  })
);
features.install();

const { routes, register } = useRouting();

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...routes.value,
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

register(router);

export default router;
