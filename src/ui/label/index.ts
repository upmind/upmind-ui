// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Label } from "./Label.ce.vue";
export { type LabelProps } from "./types";

// --- custom elements
import Label from "./Label.ce.vue";
export const UpmLabel = defineCustomElement(Label);
