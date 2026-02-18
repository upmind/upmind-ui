import { defineCustomElement } from "vue";
import Badge from "./Badge.ce.vue";
import { variants } from "./badge.config";
import { keys } from "lodash-es";

export { default as Badge } from "./Badge.ce.vue";
export { type BadgeProps } from "./types";

export const UpmBadge = defineCustomElement(Badge);

export const BADGE_VARIANTS = keys(variants.variant);
export const BADGE_COLORS = keys(variants.color);
export const BADGE_SIZES = keys(variants.size);
