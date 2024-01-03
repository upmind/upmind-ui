export default {
  routes: [
    {
      path: "/domain",
      name: "Domains",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/DomainView.vue")
    },
    {
      path: "/web-hosting",
      name: "Web hosting",
      //  is lazy-loaded when the route is visited.
      component: () => import("../views/WebHostingDomainView.vue")
    }
  ]
};
