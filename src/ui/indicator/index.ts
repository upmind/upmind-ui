import { defineCustomElement } from "vue";
import Indicator from "./Indicator.ce.vue";

export { default as Indicator } from "./Indicator.ce.vue";
export { type IndicatorProps } from "./types";

export const UpmIndicator = defineCustomElement(Indicator);
