export default {
  routes: [
    {
      path: "/system",
      name: "system",
      component: () => import("../views/SystemView.vue")
    }
  ]
};
