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
          component: () => import("./Billing.vue")
        }
      ]
    }
  ]
};
