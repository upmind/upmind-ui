// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Select } from "./Select.ce.vue";

export { type SelectProps } from "./types";
export type { SelectItemProps } from "radix-vue";

// --- custom elements
import Select from "./Select.ce.vue";
export const UpmSelect = defineCustomElement(Select);
