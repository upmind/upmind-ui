// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as CheckboxCards } from "./CheckboxCards.ce.vue";

// --- custom elements
import CheckboxCards from "./CheckboxCards.ce.vue";
export const UpmCheckboxCards = defineCustomElement(CheckboxCards);

// --- types
export * from "./types";
