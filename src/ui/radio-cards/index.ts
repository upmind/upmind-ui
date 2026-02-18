import { defineCustomElement } from "vue";
import RadioCards from "./RadioCards.ce.vue";

export { default as RadioCards } from "./RadioCards.ce.vue";

export const UpmRadioCards = defineCustomElement(RadioCards);

export * from "./types";
