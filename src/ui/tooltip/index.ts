import { defineCustomElement } from "vue";
import TooltipCE from "./Tooltip.ce.vue";

export { default as Tooltip } from "./Tooltip.ce.vue";

export const UpmTooltip = defineCustomElement(TooltipCE);
