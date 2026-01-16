import { defineAsyncComponent } from "vue";

export const EmailHistory = defineAsyncComponent(
  () => import("./EmailHistory.vue")
);
export const EmailView = defineAsyncComponent(() => import("./Email.vue"));
export const EmailOverview = defineAsyncComponent(
  () => import("./EmailOverview.vue")
);
export const EmailHistoryListing = defineAsyncComponent(
  () => import("./EmailHistoryListing.vue")
);
export const EmailHistorySort = defineAsyncComponent(
  () => import("./EmailHistorySort.vue")
);
