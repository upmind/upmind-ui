import Detail from "./Detail.vue";
import Listings from "./Listings.vue";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/products-catalogue",
    name: "products.catalogue",
    alias: "/products",
    component: Listings,
    meta: {
      title: "Products Catalogue",
      nav: {
        label: "Catalogue",
        icon: "grid-01",
        section: "Products",
        order: 1
      }
    }
  },
  {
    path: "/products-catalogue/:id",
    name: "products.catalogue.detail",
    component: Detail,
    meta: {
      title: "Product Detail",
      nav: {
        label: "Product Detail",
        icon: "eye",
        section: "Products",
        order: 2,
        hidden: true
      }
    }
  }
];

export default {
  routes
};
