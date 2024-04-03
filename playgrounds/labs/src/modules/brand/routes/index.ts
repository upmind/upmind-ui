import PageView from "@/views/PageView.vue";
import NestedView from "@/views/NestedView.vue";
// -------------------------------------------------------------------------

export default {
  routes: [
    {
      path: "/brand",
      name: "brand",
      component: NestedView,
      children: [
        {
          path: "",
          name: "brand-settings",
          component: PageView,
          meta: {
            name: "auth",
            title: "Brand settings",
            description:
              "This is the brand settings page. You can see all the brand settings here.",
            flow: "Brand Flow",
            inspect: "brand",
          },
        },
        {
          path: "embed",
          name: "brand-settings-embed",
          component: () => import("../views/BrandView.vue"),
          meta: { hidden: true },
        },
      ],
    },
  ],
};
