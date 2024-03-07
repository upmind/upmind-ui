export default {
  routes: [
    {
      path: "/auth-flow",
      name: "auth-flow",
      component: () => import("../views/AuthView.vue"),
      children: [
        {
          path: "",
          name: "default",
          component: () => import("../views/DefaultView.vue"),
        },
        {
          path: "illustration",
          name: "illustration",
          component: () => import("../views/IllustrationView.vue"),
        },
        {
          path: "background",
          name: "background",
          component: () => import("../views/BackgroundView.vue"),
        },
        {
          path: "description",
          name: "description",
          component: () => import("../views/DescriptionView.vue"),
        },
      ],
    },
  ],
};
