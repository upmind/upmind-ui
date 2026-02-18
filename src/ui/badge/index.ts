import { variants } from "./badge.config";
import { keys } from "lodash-es";

export { default as Badge } from "./Badge.ce.vue";
export { type BadgeProps } from "./types";

export const BADGE_VARIANTS = keys(variants.variant);
export const BADGE_COLORS = keys(variants.color);
export const BADGE_SIZES = keys(variants.size);
