/**
 * @module auth-app/router
 * @description Every route on this app comes from the `auth` package's own
 * `defineFeature` contribution (ADR 023 §8), read back through `foundation`'s
 * route registry. The app declares none of its own — that is what makes this a
 * decoupling proof rather than a second implementation.
 */
import { createRouter, createWebHistory } from "vue-router";
import { AUTH_ROUTE, defineAuthFeature } from "@upmind-automation/auth";
import { useFeatures, useRouting } from "@upmind-automation/foundation";

const features = useFeatures();

// `returnTarget: true` arms the package's own flow: an authenticated visitor on
// one of these routes is handed back to `?returnUrl=`.
features.register(defineAuthFeature({ base: "/", returnTarget: true }));
features.install();

const { routes, register } = useRouting();

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...routes.value,
    { path: "/:pathMatch(.*)*", redirect: { name: AUTH_ROUTE.LOGIN } }
  ]
});

register(router);

export default router;
