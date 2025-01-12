// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as SelectCards } from "./SelectCards.ce.vue";

// --- custom elements
import SelectCards from "./SelectCards.ce.vue";
export const UwSelectCards = defineCustomElement(SelectCards);

// --- types
export * from "./types";
