import PageView from "@/views/PageView.vue";
import NestedView from "@/views/NestedView.vue";
// -------------------------------------------------------------------------

export default {
  routes: [
    {
      path: "/style-guide",
      name: "style-guide",
      component: NestedView,
      children: [
        // --- Intro ---
        {
          path: "",
          name: "style-guide-intro",
          component: PageView,
          meta: {
            name: "style-guide",
            title: "Introduction to the style guide",
            description:
              "This explains the purpose of the style guide and how to use it.",
            flow: "Style Guide",
          },
        },
        {
          path: "embed",
          name: "default-embed",
          component: () => import("../views/IntroEmbed.vue"),
          meta: { hidden: true },
        },
        // --- Typography ---
        {
          path: "typography",
          name: "style-guide-typography",
          component: PageView,
          meta: {
            name: "style-guide",
            title: "Typographic styles",
            description:
              "A guide to the typography used in the app. This includes all the different text styles, sizes, and weights, as well as all the common HTML elements used in WYSIWYG content.",
            flow: "Style Guide",
          },
        },
        {
          path: "typography/embed",
          name: "style-guide-typography-embed",
          component: () => import("../views/TypographyEmbed.vue"),
          meta: { hidden: true },
        },
        // --- Colors ---
        {
          path: "colors",
          name: "style-guide-colors",
          component: PageView,
          meta: {
            name: "style-guide",
            title: "Color palette",
            description:
              "A guide to the color palette used in the app. This includes all the different colors, their names, and their usage.",
            flow: "Style Guide",
          },
        },
        {
          path: "colors/embed",
          name: "style-guide-colors-embed",
          component: () => import("../views/ColorsEmbed.vue"),
          meta: { hidden: true },
        },
        // --- Icons ---
        {
          path: "icons",
          name: "style-guide-icons",
          component: PageView,
          meta: {
            name: "style-guide",
            title: "Icons",
            description:
              "A guide to the iconography used in the app. This includes all the different icons, their names, and their usage.",
            flow: "Style Guide",
          },
        },
        {
          path: "icons/embed",
          name: "style-guide-icons-embed",
          component: () => import("../views/IconsEmbed.vue"),
          meta: { hidden: true },
        },
        // --- Buttons ---
        {
          path: "buttons",
          name: "style-guide-buttons",
          component: PageView,
          meta: {
            name: "style-guide",
            title: "Buttons",
            description:
              "A guide to the buttons used in the app. This includes all the different button styles, sizes, and states.",
            flow: "Style Guide",
          },
        },
        {
          path: "buttons/embed",
          name: "style-guide-buttons-embed",
          component: () => import("../views/ButtonsEmbed.vue"),
          meta: { hidden: true },
        },
        // --- Forms ---
        {
          path: "forms",
          name: "style-guide-forms",
          component: PageView,
          meta: {
            name: "style-guide",
            title: "Forms",
            description:
              "A guide to the forms used in the app. This includes all the different form elements, their styles, and their states.",
            flow: "Style Guide",
          },
        },
        {
          path: "forms/embed",
          name: "style-guide-forms-embed",
          component: () => import("../views/FormsEmbed.vue"),
          meta: { hidden: true },
        },
        // --- Cards ---
        {
          path: "cards",
          name: "style-guide-cards",
          component: PageView,
          meta: {
            name: "style-guide",
            title: "Cards",
            description:
              "A guide to the cards used in the app. This includes all the different card styles, sizes, and states.",
            flow: "Style Guide",
          },
        },
        {
          path: "cards/embed",
          name: "style-guide-cards-embed",
          component: () => import("../views/CardsEmbed.vue"),
          meta: { hidden: true },
        },
      ],
    },
  ],
};
