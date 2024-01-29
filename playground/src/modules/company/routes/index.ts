export default {
  routes: [
    {
      path: "/companies",
      name: "companies",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/CompaniesView.vue")
    }
  ]
};
