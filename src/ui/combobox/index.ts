// --- external
import { defineCustomElement } from "vue";
import { keys } from "lodash-es";

// --- vue elements
export { default as Combobox } from "./Combobox.ce.vue";
export * from "./types";

// --- custom elements
import Combobox from "./Combobox.ce.vue";
export const UpmCombobox = defineCustomElement(Combobox);

// types
import { variants } from "./combobox.config";
export const COMBOBOX_WIDTHS = keys(variants.width);
export const COMBOBOX_SIZES = keys(variants.size);
