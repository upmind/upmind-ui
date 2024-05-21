export default {
  routes: [
    {
      path: "/offers",
      name: "offers",
      component: () => import("./Offers.vue"),
    },
  ],
};
