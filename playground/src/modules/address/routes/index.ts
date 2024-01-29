export default {
  routes: [
    {
      path: "/addresses",
      name: "Addresses",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/AddressesView.vue")
    }
  ]
};
