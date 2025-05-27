// --- external
import { RouteRecordRaw } from "vue-router";

// --- internal
import ProductsCatalogue from "./ProductsCatalogue.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/products-catalogue",
    name: "products.catalogue",
    component: ProductsCatalogue,
    meta: {
      title: "Products Catalogue",
    },
  },
];

export default {
  routes,
};
