export default {
  routes: [
    {
      path: "/clients/addresses",
      name: "Client Addresses",
      component: () => import("../address/views/AddressesView.vue")
    },
    {
      path: "/clients/companies",
      name: "Client Companies",
      component: () => import("../company/views/CompaniesView.vue")
    }
  ]
};
