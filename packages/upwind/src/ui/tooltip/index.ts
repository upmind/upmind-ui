// --- external
import { defineCustomElement } from "vue";

// --- components
export { default as Tooltip } from "./Tooltip.vue";
export { default as TooltipContent } from "./TooltipContent.vue";
export { default as TooltipTrigger } from "./TooltipTrigger.vue";
export { default as TooltipProvider } from "./TooltipProvider.vue";

// --- custom elements
import TooltipCE from "./Tooltip.ce.vue";
export const UwTooltip = defineCustomElement(TooltipCE);
