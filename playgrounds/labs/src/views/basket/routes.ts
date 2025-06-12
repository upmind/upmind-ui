import path from "path";

export default {
  routes: [
    {
      path: "/basket/billing",
      component: () => import("./Basket.vue"),
      children: [
        {
          path: "",
          name: "basket.billing",
          component: () => import("./billing/Listings.vue"),
        },
        {
          path: "new",
          name: "basket.billing.add",
          component: () => import("./billing/Add.vue"),
        },
        {
          path: ":id",
          name: "basket.billing.edit",
          component: () => import("./billing/Edit.vue"),
        },
      ],
    },
  ],
};
