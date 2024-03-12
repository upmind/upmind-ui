export default {
  routes: [
    {
      path: "/styleguide",
      name: "styleguide",
      component: () => import("../views/index.vue"),
      children: [
        {
          path: "",
          name: "intro",
          component: () => import("../views/HomeView.vue"),
        },
        {
          path: "typography",
          name: "typography",
          component: () => import("../views/TypographyView.vue"),
        },
        {
          path: "colors",
          name: "colors",
          component: () => import("../views/ColorsView.vue"),
        },
        {
          path: "buttons",
          name: "buttons",
          component: () => import("../views/ButtonsView.vue"),
        },
        {
          path: "form",
          name: "form",
          component: () => import("../views/FormView.vue"),
        },
      ],
    },
  ],
};
