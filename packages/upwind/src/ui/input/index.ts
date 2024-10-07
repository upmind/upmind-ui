// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Input } from "./Input.ce.vue";
export { type InputProps } from "./types";

// --- custom elements
import Input from "./Input.ce.vue";
export const UwInput = defineCustomElement(Input);
