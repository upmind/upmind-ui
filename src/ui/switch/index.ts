import { defineCustomElement } from "vue";
import Switch from "./Switch.ce.vue";

export { default as Switch } from "./Switch.ce.vue";
export { type SwitchProps } from "./types";

export const UpmSwitch = defineCustomElement(Switch);
