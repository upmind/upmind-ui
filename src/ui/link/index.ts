// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";
// --- vue elements
export { default as Link } from "./Link.ce.vue";
export { type LinkProps } from "./types";
// --- custom elements
import Link from "./Link.ce.vue";

export const UpmLink = defineCustomElement(Link);
// --- types
import { variants } from "./link.config";

export const LINK_COLORS = keys(variants.color);
export const LINK_SIZES = keys(variants.size);
