import { defineAsyncComponent } from "vue";

export const UpmBasketProductEdit = defineAsyncComponent(
  () => import("./Edit.vue")
);
export const UpmPromotionBadge = defineAsyncComponent(
  () => import("./components/card/components/Promotion.vue")
);
export const UpmBasketProductCards = defineAsyncComponent(
  () => import("./components/card/BasketProductCards.vue")
);

export { BASKET_PRODUCT_TEMPLATE } from "./types";
