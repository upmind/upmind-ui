export default {
  register: () => {},

  routes: [
    {
      path: "/billing",
      name: "billing",
      redirect: { name: "billing.details" },
      component: () => import("./Index.vue"),
      children: [
        {
          path: "details",
          name: "billing.details",
          component: () => import("./Billing.vue"),
          meta: {
            nav: {
              label: "Billing Details",
              icon: "credit-card-01",
              section: "Portal",
              order: 11
            }
          }
        }
      ]
    }
  ]
};
