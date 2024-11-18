// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Spinner } from "./Spinner.ce.vue";
export { type SpinnerProps } from "./types";

// --- custom elements
import Spinner from "./Spinner.ce.vue";
export const UwSpinner = defineCustomElement(Spinner);
