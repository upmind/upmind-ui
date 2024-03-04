export default {
  routes: [
    {
      path: "/requests",
      name: "requests",
      component: () => import("../views/RequestsView.vue")
    }
  ]
};
