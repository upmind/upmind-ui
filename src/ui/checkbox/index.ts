// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Checkbox } from "./Checkbox.ce.vue";
export { type CheckboxProps } from "./types";

// --- custom elements
import Checkbox from "./Checkbox.ce.vue";
export const UwCheckbox = defineCustomElement(Checkbox);
