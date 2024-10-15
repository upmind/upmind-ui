// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Toggle } from "./Toggle.ce.vue";
export { type ToggleProps } from "./types";

// --- custom elements
import Toggle from "./Toggle.ce.vue";
export const UwToggle = defineCustomElement(Toggle);
