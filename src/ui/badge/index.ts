// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";

// --- vue elements
export { default as Badge } from "./Badge.ce.vue";
export { type BadgeProps } from "./types";

// --- custom elements
import Badge from "./Badge.ce.vue";
export const UpmBadge = defineCustomElement(Badge);

// --- types
import { variants } from "./badge.config";
export const BADGE_VARIANTS = keys(variants.variant);
export const BADGE_COLORS = keys(variants.color);
export const BADGE_SIZES = keys(variants.size);
