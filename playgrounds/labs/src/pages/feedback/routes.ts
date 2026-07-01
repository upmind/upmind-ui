import Feedback from "./Feedback.vue";
import type { RouteRecordRaw } from "vue-router";

// --- internal

// -----------------------------------------------------------------------------

const routes: RouteRecordRaw[] = [
  {
    path: "/feedback",
    name: "feedback",
    component: Feedback,
    meta: {
      title: "Feedback machine",
      nav: {
        label: "Feedback",
        icon: "message-chat-circle",
        section: "Labs",
        order: 3
      }
    }
  }
];

export default {
  routes
};
