export default {
  routes: [
    {
      path: "/client-area",
      component: () => import("./ClientArea.vue"),
      children: [
        {
          path: "slots",
          name: "client-area.slots",
          component: () => import("./Slots.vue")
        },
        {
          path: "template",
          name: "client-area.template",
          component: () => import("./Template.vue")
        }
      ]
    }
  ]
};
