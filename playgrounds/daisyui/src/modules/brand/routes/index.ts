export default {
  routes: [
    {
      path: "/brand",
      name: "brand",
      component: () => import("../views/BrandView.vue")
    }
  ]
};
