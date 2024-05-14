export default {
  routes: [
    {
      path: "/client",
      name: "Client",
      component: () => import("./Client.vue"),
      children: [
        {
          path: "",
          name: "Client Details",
          component: () => import("./Details.vue"),
        },
        {
          path: "addresses",
          name: "Client Addresses",
          component: () => import("./Addresses.vue"),
        },
        {
          path: "emails",
          name: "Client Emails",
          component: () => import("./Emails.vue"),
        },
        {
          path: "phones",
          name: "Client Phones",
          component: () => import("./Phones.vue"),
        },
        {
          path: "companies",
          name: "Client Companies",
          component: () => import("./Companies.vue"),
        },
      ],
    },
  ],
};
