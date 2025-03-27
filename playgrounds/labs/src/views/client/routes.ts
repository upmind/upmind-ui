export default {
  routes: [
    {
      path: "/client/phones",
      name: "client.phones",
      component: () => import("./Phones.vue"),
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
