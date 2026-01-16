export default {
  register: () => {},

  routes: [
    {
      path: "/admin/billing",
      name: "admin.billing",
      redirect: { name: "admin.billing.details" },
      component: () => import("./Index.vue"),
      children: [
        {
          path: "details",
          name: "admin.billing.details",
          component: () => import("./Billing.vue"),
          meta: {
            nav: {
              label: "Billing Details",
              icon: "credit-card-01",
              section: "Admin",
              order: 11
            }
          }
        }
      ]
    }
  ]
};
