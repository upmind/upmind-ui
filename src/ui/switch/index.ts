// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Switch } from "./Switch.ce.vue";
export { type SwitchProps } from "./types";

// --- custom elements
import Switch from "./Switch.ce.vue";
export const UpmSwitch = defineCustomElement(Switch);
