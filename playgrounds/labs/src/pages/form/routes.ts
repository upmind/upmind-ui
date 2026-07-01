import Address from "./Address.vue";
import Domain from "./Domain.vue";
import type { RouteRecordRaw } from "vue-router";
// -----------------------------------------------------------------------------

const routes: RouteRecordRaw[] = [
  {
    path: "/form/address",
    name: "form.address",
    component: Address,
    meta: {
      title: "Address Renderer",
      nav: {
        label: "Address Form",
        icon: "home-01",
        section: "Labs",
        order: 4,
        parent: "forms"
      }
    }
  },
  {
    path: "/form/domain",
    name: "form.domain",
    component: Domain,
    meta: {
      title: "Domain Renderer",
      nav: {
        label: "Domain Form",
        icon: "globe-01",
        section: "Labs",
        order: 5,
        parent: "forms"
      }
    }
  }
];

export default {
  routes
};
