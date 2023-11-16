export default {
  routes: [
    {
      path: "/form",
      name: "form",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/FormView.vue")
    }
  ]
};
