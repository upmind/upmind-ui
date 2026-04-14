export default {
  register: () => {},

  routes: [
    {
      path: "/paymentDetailAdd",
      name: "paymentDetailAdd",
      component: () => import("./Index.vue"),
      meta: {
        needsAuth: true,
        nav: {
          label: "usePaymentDetailAdd",
          icon: "credit-card-01",
          section: "Composables",
          order: 20
        }
      }
    }
  ]
};
