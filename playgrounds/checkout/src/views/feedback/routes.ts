export default {
  routes: [
    {
      path: "/feedback",
      name: "feedback",
      component: () => import("./Feedback.vue"),
    },
  ],
};
