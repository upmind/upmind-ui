export default {
  routes: [
    {
      path: "/styleguide",
      name: "styleguide",
      component: () => import("../views/StyleGuideView.vue"),
      children: [
        {
          path: "buttons",
          component: () => import("../views/ButtonsView.vue"),
        },
      ],
    },
  ],
};
