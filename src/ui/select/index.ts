import { defineCustomElement } from "vue";
import Select from "./Select.ce.vue";
import { variants } from "./select.config";
import { keys } from "lodash-es";

export { default as Select } from "./Select.ce.vue";
export { type SelectProps, type SelectItemAdditional } from "./types";
export type { SelectItemProps } from "radix-vue";

export const UpmSelect = defineCustomElement(Select);

export const SELECT_WIDTHS = keys(variants.width);
export const SELECT_SIZES = keys(variants.size);
