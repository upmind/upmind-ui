// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";

// --- vue elements
export { default as Select } from "./Select.ce.vue";

export { type SelectProps, type SelectItemAdditional } from "./types";
export type { SelectItemProps } from "radix-vue";

// --- custom elements
import Select from "./Select.ce.vue";
export const UpmSelect = defineCustomElement(Select);

// types
import { variants } from "./select.config";
export const SELECT_WIDTHS = keys(variants.width);
export const SELECT_SIZES = keys(variants.size);
