// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";

// --- vue elements
export { default as Button } from "./Button.ce.vue";
export { default as Link } from "./Link.ce.vue"; // syntactic sugar
export { type ButtonProps } from "./types";

// --- custom elements
import Button from "./Button.ce.vue";
export const UpmButton = defineCustomElement(Button);

// --- types
import { variants } from "./button.config";
export const BUTTON_VARIANTS = keys(variants.variant);
export const BUTTON_SIZES = keys(variants.size);
export const BUTTON_ALIGNMENTS = keys(variants.align);
