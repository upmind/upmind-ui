// --- external
import { RouteRecordRaw } from "vue-router";

// --- internal
import Address from "./Address.vue";
import Domain from "./Domain.vue";
// -----------------------------------------------------------------------------

const routes: RouteRecordRaw[] = [
  {
    path: "/form/address",
    name: "form.address",
    component: Address,
    meta: {
      title: "Address Renderer"
    }
  },
  {
    path: "/form/domain",
    name: "form.domain",
    component: Domain,
    meta: {
      title: "Domain Renderer"
    }
  }
];

export default {
  routes
};
