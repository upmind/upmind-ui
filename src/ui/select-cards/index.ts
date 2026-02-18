import { variants } from "./selectCards.config";
import { keys } from "lodash-es";

export { default as SelectCards } from "./SelectCards.ce.vue";

export * from "./types";

export const SELECT_CARDS_WIDTHS = keys(variants.width);
