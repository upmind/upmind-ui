export default {
  routes: [
    {
      path: "/basket",
      name: "basket",
      component: () => import("../views/BasketView.vue")
    }
  ]
};
