// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Indicator } from "./Indicator.ce.vue";
export { type IndicatorProps } from "./types";

// --- custom elements
import Indicator from "./Indicator.ce.vue";
export const UwIndicator = defineCustomElement(Indicator);
