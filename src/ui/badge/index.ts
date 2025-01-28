// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Badge } from "./Badge.ce.vue";
export { type BadgeProps } from "./types";

// --- custom elements
import Badge from "./Badge.ce.vue";
export const UpmBadge = defineCustomElement(Badge);
