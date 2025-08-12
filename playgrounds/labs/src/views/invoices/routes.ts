export default {
  routes: [
    {
      path: "/invoices",
      name: "invoices",
      component: () => import("./Invoices.vue"),
      children: [
        {
          path: "invoice",
          name: "invoice",
          component: () => import("./Invoice.vue")
        }
      ]
    }
  ]
};
