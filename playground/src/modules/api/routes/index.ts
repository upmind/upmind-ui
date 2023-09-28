export default {
  routes: [
    {
      path: "/requests",
      name: "requests",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/RequestsView.vue")
    }
  ]
};
