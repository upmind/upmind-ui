export default {
  routes: [
    {
      path: "/dac",
      name: "dac",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/DacView.vue")
    }
  ]
};
