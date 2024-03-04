export default {
  routes: [
    {
      path: "/clients/addresses",
      name: "Client Addresses",
      component: () => import("../address/views/View.vue")
    },
    {
      path: "/clients/emails",
      name: "Client Emails",
      component: () => import("../email/views/View.vue")
    },
    {
      path: "/clients/phones",
      name: "Client Phones",
      component: () => import("../phone/views/View.vue")
    },
    {
      path: "/clients/companies",
      name: "Client Companies",
      component: () => import("../company/views/View.vue")
    }
  ]
};
