export default {
  routes: [
    {
      path: "/session",
      name: "session",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/SessionView.vue")
    }
  ]
};
