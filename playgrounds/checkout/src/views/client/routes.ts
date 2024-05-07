export default {
  routes: [
    {
      path: "/client",
      name: "Client",
      component: () => import("./Client.vue"),
      children: [
        // {
        //   path: "addresses",
        //   name: "Client Addresses",
        //   component: () => import("./address/View.vue"),
        // },
        // {
        //   path: "emails",
        //   name: "Client Emails",
        //   component: () => import("./email/View.vue"),
        // },
        // {
        //   path: "phones",
        //   name: "Client Phones",
        //   component: () => import("./phone/View.vue"),
        // },
        // {
        //   path: "companies",
        //   name: "Client Companies",
        //   component: () => import("./company/View.vue"),
        // },
      ],
    },
  ],
};
