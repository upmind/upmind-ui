export default {
  routes: [
    {
      path: "/checkout",
      name: "checkout",
      component: () => import("./Checkout.vue"),
    },
  ],
};
