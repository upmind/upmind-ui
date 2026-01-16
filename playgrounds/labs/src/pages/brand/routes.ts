export default {
  register: () => {},

  routes: [
    {
      path: "/brand",
      name: "brand",
      component: () => import("./Brand.vue"),
      meta: {
        nav: { label: "Brand", icon: "palette", section: "Labs", order: 1 }
      }
    }
  ]
};
