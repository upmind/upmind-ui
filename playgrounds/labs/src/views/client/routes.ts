export default {
  routes: [
    {
      path: "/client",
      component: () => import("./Client.vue"),
      children: [
        {
          path: "addresses",
          name: "client.addresses",
          component: () => import("./Addresses.vue"),
        },
        {
          path: "companies",
          name: "client.companies",
          component: () => import("./Companies.vue"),
        },
        {
          path: "phones",
          name: "client.phones",
          component: () => import("./Phones.vue"),
        },
        {
          path: "emails",
          name: "client.emails",
          component: () => import("./Emails.vue"),
        },
      ],
    },
  ],
};
