import { ROUTE } from "../types";

export default [
  {
    path: "/billing",
    name: ROUTE.BILLING,
    redirect: { name: ROUTE.BILLING_DETAILS }
  },
  {
    path: "/billing/details",
    name: ROUTE.BILLING_DETAILS,
    component: () => import("../../views/billing/Billing.vue")
  }
];
