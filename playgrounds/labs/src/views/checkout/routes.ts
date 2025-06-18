// --- external
import { RouteRecordRaw } from "vue-router";

// --- internal

// -----------------------------------------------------------------------------

const routes: RouteRecordRaw[] = [
  {
    path: "/checkout/billing",
    name: "billing",
    component: () => import("./Billing.vue"),
  },
];

export default {
  routes,
};
