import { defineCustomElement } from "vue";
import CheckboxCards from "./CheckboxCards.ce.vue";

export { default as CheckboxCards } from "./CheckboxCards.ce.vue";

export const UpmCheckboxCards = defineCustomElement(CheckboxCards);

export * from "./types";
