import { defineCustomElement } from "vue";
import SelectCards from "./SelectCards.ce.vue";
import { variants } from "./selectCards.config";
import { keys } from "lodash-es";

export { default as SelectCards } from "./SelectCards.ce.vue";

export const UpmSelectCards = defineCustomElement(SelectCards);

export * from "./types";

export const SELECT_CARDS_WIDTHS = keys(variants.width);
