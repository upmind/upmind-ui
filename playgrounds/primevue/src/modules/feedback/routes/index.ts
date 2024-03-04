export default {
  routes: [
    {
      path: "/feedback",
      name: "feedback",
      component: () => import("../views/FeedbackView.vue")
    }
  ]
};
