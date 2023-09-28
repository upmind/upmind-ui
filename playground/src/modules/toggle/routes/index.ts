export default {
  routes: [
    {
      path: "/toggle",
      name: "toggle",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/ToggleView.vue")
    }
  ]
};
