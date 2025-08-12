// --- external
import { RouteRecordRaw } from "vue-router";

// --- internal
import Feedback from "./Feedback.vue";

// -----------------------------------------------------------------------------

const routes: RouteRecordRaw[] = [
  {
    path: "/feedback",
    name: "feedback",
    component: Feedback,
    meta: {
      title: "Feedback machine"
    }
  }
];

export default {
  routes
};
