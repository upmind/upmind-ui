// --- external
import type { RouteRecordRaw } from "vue-router";

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
      nav: {
        label: "Places API",
        icon: "marker-pin-01",
        section: "Labs",
        order: 2
      }
    }
  }
];

export default {
  routes
};
