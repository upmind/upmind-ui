export default {
  routes: [
    {
      path: "/system",
      name: "system",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/SystemView.vue")
    }
  ]
};
