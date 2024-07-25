export default {
  routes: [
    {
      path: "/domains",
      name: "domains",
      component: () => import("./Domains.vue"),
    },
  ],
};
