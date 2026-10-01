/**
 * @module payment-app/router
 * @description Mounts the pay page on this app's pay path.
 */
import { createRouter, createWebHistory } from "vue-router";
import NoInvoice from "./NoInvoice.vue";
import { paymentRoutes } from "./routes";

export const LANDING_ROUTE = {
  name: "no-invoice",
  path: "/"
} as const;

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...paymentRoutes,
    {
      path: LANDING_ROUTE.path,
      name: LANDING_ROUTE.name,
      component: NoInvoice
    },
    { path: "/:pathMatch(.*)*", redirect: { name: LANDING_ROUTE.name } }
  ]
});

export default router;
