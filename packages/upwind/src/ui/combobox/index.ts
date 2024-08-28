// --- external
import { defineCustomElement } from "vue";

// --- custom elements
import ComboboxCE from "./Combobox.ce.vue";
export const UwCombobox = defineCustomElement(ComboboxCE);

// --- custom elements
import ComboboxItemCE from "./ComboboxItem.ce.vue";
export const UwComboboxItem = defineCustomElement(ComboboxItemCE);
