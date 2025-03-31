export default {
  routes: [
    {
      path: "/client/phones",
      component: () => import("./Client.vue"),
      children: [
        {
          path: "",
          name: "client.phones",
          component: () => import("./phone/Listings.vue"),
        },
        {
          path: "new",
          name: "client.phones.add",
          component: () => import("./phone/Add.vue"),
        },
        {
          path: ":id",
          name: "client.phones.edit",
          component: () => import("./phone/Edit.vue"),
        },
      ],
    },
    {
      path: "/client/companies",
      component: () => import("./Client.vue"),
      children: [
        {
          path: "",
          name: "client.companies",
          component: () => import("./company/Listings.vue"),
        },
        {
          path: "new",
          name: "client.companies.add",
          component: () => import("./company/Add.vue"),
        },
        {
          path: ":id",
          name: "client.companies.edit",
          component: () => import("./company/Edit.vue"),
        },
      ],
    },
    {
      path: "/client/addresses",
      component: () => import("./Client.vue"),
      children: [
        {
          path: "",
          name: "client.addresses",
          component: () => import("./address/Listings.vue"),
        },
        {
          path: "new",
          name: "client.addresses.add",
          component: () => import("./address/Add.vue"),
        },
        {
          path: ":id",
          name: "client.addresses.edit",
          component: () => import("./address/Edit.vue"),
        },
      ],
    },
    {
      path: "/client/emails",
      component: () => import("./Client.vue"),
      children: [
        {
          path: "",
          name: "client.emails",
          component: () => import("./email/Listings.vue"),
        },
        {
          path: "new",
          name: "client.emails.add",
          component: () => import("./email/Add.vue"),
        },
      ],
    },
  ],
};
