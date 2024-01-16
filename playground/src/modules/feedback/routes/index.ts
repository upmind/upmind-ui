export default {
  routes: [
    {
      path: "/feedback",
      name: "feedback",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/FeedbackView.vue")
    }
  ]
};
