export default {
  routes: [
    {
      path: "/orders/:orderId",
      name: "order",
      component: () => import("./Order.vue"),
    },
  ],
};
