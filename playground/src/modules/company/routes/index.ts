export default {
  routes: [
    {
      path: "/companies",
      name: "Companies",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/CompaniesView.vue")
    }
  ]
};
