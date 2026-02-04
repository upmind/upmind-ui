// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";
// --- vue elements
export { default as Alert } from "./Alert.ce.vue";
export { type AlertProps } from "./types";
// --- custom elements
import Alert from "./Alert.ce.vue";

export const UpmAlert = defineCustomElement(Alert);
// --- types
import { variants } from "./alert.config";

export const ALERT_VARIANTS = keys(variants.variant);
export const ALERT_COLORS = keys(variants.color);
export const ALERT_SIZES = keys(variants.size);
