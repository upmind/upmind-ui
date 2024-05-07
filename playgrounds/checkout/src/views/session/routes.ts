export default {
  routes: [
    {
      path: "/session",
      name: "session",
      component: () => import("./Session.vue"),
    },
  ],
};
