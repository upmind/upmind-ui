// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";

// --- vue elements
export { default as SelectCards } from "./SelectCards.ce.vue";

// --- custom elements
import SelectCards from "./SelectCards.ce.vue";
export const UpmSelectCards = defineCustomElement(SelectCards);

// --- types
export * from "./types";
import { variants } from "./selectCards.config";
export const SELECT_CARDS_WIDTHS = keys(variants.width);
