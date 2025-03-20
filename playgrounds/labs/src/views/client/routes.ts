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
    },
    {
      path: "/client/emails",
      name: "client.emails",
      component: () => import("./Emails.vue"),
    },
  ],
};
