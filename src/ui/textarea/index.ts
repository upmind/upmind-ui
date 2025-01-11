// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Textarea } from "./Textarea.ce.vue";
export { type TextareaProps } from "./types";

// --- custom elements
import Textarea from "./Textarea.ce.vue";
export const UpmTextarea = defineCustomElement(Textarea);
