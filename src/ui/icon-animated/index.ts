// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as IconAnimated } from "./IconAnimated.ce.vue";
export { type AnimatedIconProps } from "./types";

// --- custom elements
import IconAnimated from "./IconAnimated.ce.vue";
export const UpmIconAnimated = defineCustomElement(IconAnimated);
