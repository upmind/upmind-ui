import { defineAsyncComponent } from "vue";

// --- expose our modules & components
export const UpmFeedback = defineAsyncComponent(() => import("./Feedback.vue"));
