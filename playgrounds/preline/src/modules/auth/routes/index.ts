export default {
  routes: [
    {
      path: "/auth-flow",
      name: "auth-flow",
      component: () => import("../views/index.vue"),
      children: [
        {
          path: "",
          name: "auth-default",
          component: () => import("../views/default/index.vue"),
          meta: {
            name: "auth",
            title: "Default view for authentication",
            description:
              "This is a simple example of a page with a form for login and a form for registration.",
            flow: "Authentication Flow",
          },
        },
        {
          path: "embed",
          name: "default-embed",
          component: () => import("../views/default/Embed.vue"),
          meta: { hidden: true },
        },
        {
          path: "illustration",
          name: "auth-illustration",
          component: () => import("../views/illustration/index.vue"),
          meta: {
            name: "auth",
            title: "Login form with illustration ",
            description:
              "Use this example to complement the login form with a visually impactful 3D illustration.",
            flow: "Authentication Flow",
          },
        },
        {
          path: "illustration/embed",
          name: "auth-illustration-embed",
          component: () => import("../views/illustration/Embed.vue"),
          meta: { hidden: true },
        },
        {
          path: "background",
          name: "auth-background",
          component: () => import("../views/background/index.vue"),
          meta: {
            name: "auth",
            title: "Login form with background ",
            description:
              "Use this example to complement the login form with a visually impactful 3D background.",
            flow: "Authentication Flow",
          },
        },
        {
          path: "background/embed",
          name: "auth-background-embed",
          component: () => import("../views/background/Embed.vue"),
          meta: { hidden: true },
        },
      ],
    },
  ],
};
