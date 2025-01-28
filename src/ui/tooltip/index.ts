// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Tooltip } from "./Tooltip.ce.vue";

// --- custom elements
import TooltipCE from "./Tooltip.ce.vue";
export const UpmTooltip = defineCustomElement(TooltipCE);
