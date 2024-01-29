export default {
  routes: [
    {
      path: "/addresses",
      name: "addresses",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/AddressesView.vue")
    }
  ]
};
