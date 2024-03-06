export default {
  routes: [
    {
      path: "/session",
      name: "session",
      component: () => import("../views/SessionView.vue"),
    },
  ],
};
