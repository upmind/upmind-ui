export default {
  routes: [
    {
      path: "/brand",
      name: "brand",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/BrandView.vue")
    }
  ]
};
