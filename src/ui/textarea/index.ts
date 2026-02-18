import { defineCustomElement } from "vue";
import Textarea from "./Textarea.ce.vue";

export { default as Textarea } from "./Textarea.ce.vue";
export { type TextareaProps } from "./types";

export const UpmTextarea = defineCustomElement(Textarea);
