// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Button } from "./Button.ce.vue";
export { type ButtonProps } from "./types";

// --- custom elements
import Button from "./Button.ce.vue";
export const UpmButton = defineCustomElement(Button);
