// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Icon } from "./Icon.ce.vue";
export { type IconProps } from "./types";

// --- custom elements
import Icon from "./Icon.ce.vue";
export const UwIcon = defineCustomElement(Icon);
