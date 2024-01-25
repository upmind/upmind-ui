export default {
  routes: [
    {
      path: "/places",
      name: "places",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/PlacesView.vue")
    }
  ]
};
