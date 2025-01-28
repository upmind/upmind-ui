// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Alert } from "./Alert.ce.vue";
export { type AlertProps } from "./types";

// --- custom elements
import Alert from "./Alert.ce.vue";
export const UpmAlert = defineCustomElement(Alert);
