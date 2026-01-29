export default {
  routes: [
    {
      path: "/invoices",
      name: "invoices",
      component: () => import("./Invoices.vue"),
      meta: {
        nav: {
          label: "Invoice List",
          icon: "file-01",
          section: "Invoices",
          order: 1
        }
      },
      children: [
        {
          path: "invoice",
          name: "invoice",
          component: () => import("./Invoice.vue"),
          meta: {
            nav: {
              label: "Invoice Detail",
              icon: "eye",
              section: "Invoices",
              order: 2
            }
          }
        }
      ]
    }
  ]
};
