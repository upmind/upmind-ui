// --- external
import { RouteRecordRaw } from "vue-router";

// --- internal
import Listings from "./Listings.vue";

// -----------------------------------------------------------------------------

const routes: RouteRecordRaw[] = [
  {
    path: "/places",
    name: "places",
    component: Listings,
    meta: {
      title: "Address Search",
    },
  },
];

export default {
  routes,
};
