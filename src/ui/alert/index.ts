// --- external
import { defineCustomElement } from "vue";
// --- internal
import Alert from "./Alert.ce.vue";
import { variants } from "./alert.config";
import { keys } from "lodash-es";
// --- exports
export { default as Alert } from "./Alert.ce.vue";
export { type AlertProps } from "./types";
export const UpmAlert = defineCustomElement(Alert);
export const ALERT_VARIANTS = keys(variants.variant);
export const ALERT_COLORS = keys(variants.color);
export const ALERT_SIZES = keys(variants.size);
