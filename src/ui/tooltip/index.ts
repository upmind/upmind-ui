// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";

// --- vue elements
export { default as Tooltip } from "./Tooltip.ce.vue";

// --- custom elements
import TooltipCE from "./Tooltip.ce.vue";
export const UpmTooltip = defineCustomElement(TooltipCE);

// --- types
export const TOOLTIP_COLORS = ["default"];
