export default {
  routes: [
    {
      path: "/domain",
      name: "domain",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/DomainView.vue")
    }
  ]
};
