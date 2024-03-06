export default {
  routes: [
    {
      path: "/form",
      name: "form",
      component: () => import("../views/FormView.vue"),
    },
  ],
};
