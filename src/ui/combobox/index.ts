// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Combobox } from "./Combobox.ce.vue";
export * from "./types";

// --- custom elements
import Combobox from "./Combobox.ce.vue";
export const UwCombobox = defineCustomElement(Combobox);

// ---
