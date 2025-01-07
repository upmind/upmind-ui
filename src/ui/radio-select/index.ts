// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as RadioSelect } from "./RadioSelect.ce.vue";

// --- custom elements
import RadioSelect from "./RadioSelect.ce.vue";
export const UwRadioSelect = defineCustomElement(RadioSelect);

// --- types
export * from "./types";
