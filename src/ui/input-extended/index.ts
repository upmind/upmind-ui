// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as InputExtended } from "./InputExtended.ce.vue";
export * from "./types";

// --- custom elements
import InputExtended from "./InputExtended.vue";
export const UpmInputExtended = defineCustomElement(InputExtended);
