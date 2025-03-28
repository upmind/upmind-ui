export default {
  routes: [
    {
      path: "/client/phones",
      name: "client.phones",
      component: () => import("./Phones.vue"),
    },
    {
      path: "/client/companies",
      name: "client.companies",
      component: () => import("./Companies.vue"),
      children: [
        {
          path: "",
          name: "client.companies.listings",
          component: () => import("./company/Listings.vue"),
        },
        {
          path: "new",
          name: "client.companies.add",
          component: () => import("./company/Add.vue"),
        },
      ],
    },
    {
      path: "/client/addresses",
      name: "client.addresses",
      component: () => import("./Addresses.vue"),
      children: [
        {
          path: "",
          name: "client.addresses.listings",
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
      name: "client.emails",
      component: () => import("./Emails.vue"),
    },
  ],
};
