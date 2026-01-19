export default {
  routes: [
    {
      path: "/client-area",
      component: () => import("./ClientArea.vue"),
      children: [
        {
          path: "slots",
          name: "client-area.slots",
          component: () => import("./Slots.vue"),
          meta: {
            nav: {
              label: "Slots",
              icon: "grid-01",
              section: "Client Management",
              order: 1
            }
          }
        },
        {
          path: "template",
          name: "client-area.template",
          component: () => import("./Template.vue"),
          meta: {
            nav: {
              label: "Template",
              icon: "layers-two-01",
              section: "Client Management",
              order: 2
            }
          }
        }
      ]
    }
  ]
};
