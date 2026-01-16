// --- external
import { RouteRecordRaw } from "vue-router";

// --- internal
import Detail from "./Detail.vue";
import Listings from "./Listings.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/products-catalogue",
    name: "products.catalogue",
    alias: "/products",
    component: Listings,
    meta: {
      title: "Products Catalogue"
    }
  },
  {
    path: "/products-catalogue/:id",
    name: "products.catalogue.detail",
    component: Detail,
    meta: {
      title: "Product Detail"
    }
  }
];

export default {
  routes
};
