// --- external
import { defineCustomElement } from "vue";
// --- vue elements
export { default as Input } from "./Input.ce.vue";
export * from "./types";
// --- custom elements
import Input from "./Input.ce.vue";

export const UpmInput = defineCustomElement(Input);
