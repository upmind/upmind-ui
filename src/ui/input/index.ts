import { defineCustomElement } from "vue";
import Input from "./Input.ce.vue";

export { default as Input } from "./Input.ce.vue";
export * from "./types";

export const UpmInput = defineCustomElement(Input);
