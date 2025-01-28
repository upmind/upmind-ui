// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as SelectCards } from "./SelectCards.ce.vue";

// --- custom elements
import SelectCards from "./SelectCards.ce.vue";
export const UpmSelectCards = defineCustomElement(SelectCards);

// --- types
export * from "./types";
