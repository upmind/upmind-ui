/**
 * @module payment-app/routes
 * @description This app's own pay path.
 */
import type { RouteRecordRaw } from "vue-router";

export const PAYMENT_ROUTE = {
  PAY: "payment-pay"
} as const;

export const PAYMENT_PARAM = {
  INVOICE_ID: "invoiceId"
} as const;

export const paymentRoutes: RouteRecordRaw[] = [
  {
    path: `/pay/:${PAYMENT_PARAM.INVOICE_ID}`,
    name: PAYMENT_ROUTE.PAY,
    component: () => import("./Pay.vue"),
    props: true
  }
];
