import { defineCustomElement } from "vue";
import Banner from "./Banner.ce.vue";
import { variants } from "./banner.config";
import { keys } from "lodash-es";
// --- exports
export { default as Banner } from "./Banner.ce.vue";
export { type BannerProps } from "./types";
export const UpmBanner = defineCustomElement(Banner);
export const BANNER_VARIANTS = keys(variants.variant);
export const BANNER_COLORS = keys(variants.color);
