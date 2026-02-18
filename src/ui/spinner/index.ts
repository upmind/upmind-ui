import { defineCustomElement } from "vue";
import Spinner from "./Spinner.ce.vue";

export { default as Spinner } from "./Spinner.ce.vue";
export { type SpinnerProps } from "./types";

export const UpmSpinner = defineCustomElement(Spinner);
