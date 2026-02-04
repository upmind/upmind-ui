// --- external
import { defineCustomElement } from "vue";
// --- vue elements
export { default as RadioCards } from "./RadioCards.ce.vue";
// --- custom elements
import RadioCards from "./RadioCards.ce.vue";

export const UpmRadioCards = defineCustomElement(RadioCards);
// --- types
export * from "./types";
