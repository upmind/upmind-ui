import PageView from "@/views/PageView.vue";
import NestedView from "@/views/NestedView.vue";
// -------------------------------------------------------------------------

export default {
  routes: [
    {
      path: "/auth-flow",
      name: "auth-flow",
      component: NestedView,
      children: [
        // --- Default ---
        {
          path: "",
          name: "auth-default",
          component: PageView,
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
          component: () => import("../views/DefaultEmbed.vue"),
          meta: { hidden: true },
        },
        // --- Illustration ---
        {
          path: "illustration",
          name: "auth-illustration",
          component: PageView,
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
          component: () => import("../views/IllustrationEmbed.vue"),
          meta: { hidden: true },
        },
        // --- Background ---
        {
          path: "background",
          name: "auth-background",
          component: PageView,
          meta: {
            name: "auth",
            title: "Login form with background ",
            description:
              "Use this example to show a background image on the whole page with the login form in the center of it.",
            flow: "Authentication Flow",
          },
        },
        {
          path: "background/embed",
          name: "auth-background-embed",
          component: () => import("../views/BackgroundEmbed.vue"),
          meta: { hidden: true },
        },
        // --- Marketing ---
        {
          path: "marketing",
          name: "auth-marketing",
          component: PageView,
          meta: {
            name: "auth",
            title: "Login form with marketing content ",
            description:
              "Use this example of a page layout with two columns where on one side there is a login form and the other side a description of the website.",
            flow: "Authentication Flow",
          },
        },
        {
          path: "marketing/embed",
          name: "auth-marketing-embed",
          component: () => import("../views/MarketingEmbed.vue"),
          meta: { hidden: true },
        },
      ],
    },
  ],
};
