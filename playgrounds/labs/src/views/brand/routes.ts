export default {
  register: () => {},

  routes: [
    {
      path: "/brand",
      name: "brand",
      component: () => import("./Brand.vue")
    }
  ]
};
