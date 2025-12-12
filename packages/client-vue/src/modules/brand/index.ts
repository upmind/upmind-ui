import { defineAsyncComponent } from "vue";

export const UpmTermsAndConditions = defineAsyncComponent(
  () => import("./TermsAndConditions.vue")
);
