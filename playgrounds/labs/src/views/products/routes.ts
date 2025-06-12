// --- external
import { RouteRecordRaw } from "vue-router";

// --- internal
import ProductCatalogue from "./Listings.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/products-catalogue",
    name: "products.catalogue",
    alias: "/products",
    component: ProductCatalogue,
    meta: {
      title: "Products Catalogue",
    },
  },
];

export default {
  routes,
};
