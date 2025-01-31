// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Link } from "./Link.ce.vue";
export { type LinkProps } from "./types";

// --- custom elements
import Link from "./Link.ce.vue";
export const UpmLink = defineCustomElement(Link);
