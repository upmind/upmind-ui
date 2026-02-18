import { defineCustomElement } from "vue";
import Combobox from "./Combobox.ce.vue";
import { variants } from "./combobox.config";
import { keys } from "lodash-es";

export { default as Combobox } from "./Combobox.ce.vue";
export * from "./types";

export const UpmCombobox = defineCustomElement(Combobox);

export const COMBOBOX_WIDTHS = keys(variants.width);
export const COMBOBOX_SIZES = keys(variants.size);
