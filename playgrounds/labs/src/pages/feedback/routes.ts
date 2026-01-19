// --- external
import type { RouteRecordRaw } from "vue-router";

// --- internal
import Feedback from "./Feedback.vue";

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
