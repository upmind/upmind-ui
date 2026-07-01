import Listings from "./Listings.vue";
import type { RouteRecordRaw } from "vue-router";

// --- internal

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
