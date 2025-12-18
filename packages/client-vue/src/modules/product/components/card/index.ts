import { defineAsyncComponent } from "vue";

export const ProductCard = defineAsyncComponent(
  () => import("./ProductCard.vue")
);
export const ProductCardSkeleton = defineAsyncComponent(
  () => import("./ProductCardSkeleton.vue")
);
