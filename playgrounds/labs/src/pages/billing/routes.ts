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
          component: () => import("./Billing.vue")
        }
      ]
    }
  ]
};
