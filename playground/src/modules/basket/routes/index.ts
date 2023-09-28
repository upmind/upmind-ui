export default {
  routes: [
    {
      path: "/basket",
      name: "basket",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/BasketView.vue")
    }
  ]
};
