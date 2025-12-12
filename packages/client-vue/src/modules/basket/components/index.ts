import { defineAsyncComponent } from "vue";

export const UpmBasketSummary = defineAsyncComponent(
  () => import("./Summary.vue")
);
