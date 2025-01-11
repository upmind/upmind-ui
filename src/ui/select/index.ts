// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Select } from "./Select.ce.vue";

export { type SelectProps } from "./types";

// --- custom elements
import Select from "./Select.ce.vue";
export const UpmSelect = defineCustomElement(Select);
