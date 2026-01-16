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
          meta: {
            nav: {
              label: "Addresses",
              icon: "marker-pin-01",
              section: "Client Management",
              order: 3
            }
          }
        },
        {
          path: "companies",
          name: "client.companies",
          component: () => import("./Companies.vue"),
          meta: {
            nav: {
              label: "Companies",
              icon: "building-01",
              section: "Client Management",
              order: 4
            }
          }
        },
        {
          path: "phones",
          name: "client.phones",
          component: () => import("./Phones.vue"),
          meta: {
            nav: {
              label: "Phones",
              icon: "phone-01",
              section: "Client Management",
              order: 5
            }
          }
        },
        {
          path: "emails",
          name: "client.emails",
          component: () => import("./Emails.vue"),
          meta: {
            nav: {
              label: "Emails",
              icon: "mail-01",
              section: "Client Management",
              order: 6
            }
          }
        }
      ]
    }
  ]
};
