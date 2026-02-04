// --- external
import { defineCustomElement } from "vue";
// --- vue elements
export { default as SelectGrouped } from "./SelectGrouped.ce.vue";
// --- custom elements
import SelectGrouped from "./SelectGrouped.ce.vue";

export const UpmSelectGrouped = defineCustomElement(SelectGrouped);
// --- composables
export * from "./utils";
// --- types
export * from "./types";
