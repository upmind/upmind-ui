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
        // --- Simple ---
        {
          path: "",
          name: "auth-light",
          component: PageView,
          meta: {
            name: "auth",
            title: "Simple form",
            description:
              "This is the default signin/signup form. It's a good starting point for your authentication flow.",
            flow: "Authentication Flow",
            inspect: "session",
          },
        },
        {
          path: "embed",
          name: "auth-light-embed",
          component: () => import("../views/SimpleEmbed.vue"),
          meta: { hidden: true },
        },
        // --- Illustration ---
        {
          path: "illustration",
          name: "auth-illustration",
          component: PageView,
          meta: {
            name: "auth",
            title: "Form with illustration ",
            description:
              "An implementation to show a complimentary illustration next to the signin/signup form.",

            flow: "Authentication Flow",
            inspect: "session",
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
            title: "Form with background ",
            description:
              "An implementation to show a background image on the whole page with the signin/signup form in the center of it.",
            flow: "Authentication Flow",
            inspect: "session",
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
            title: "Form with Marketing",
            description:
              "An implementation to show a marketing banner to promote the signup with some compelling copy.",
            flow: "Authentication Flow",
            inspect: "session",
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
