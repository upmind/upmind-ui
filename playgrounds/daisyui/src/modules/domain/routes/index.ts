export default {
  routes: [
    {
      path: "/domain",
      name: "Domains",
      component: () => import("../views/DomainView.vue")
    },
    {
      path: "/web-hosting",
      name: "Web hosting",
      component: () => import("../views/WebHostingDomainView.vue")
    }
  ]
};
