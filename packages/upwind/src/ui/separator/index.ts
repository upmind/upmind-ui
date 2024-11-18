// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Separator } from "./Separator.ce.vue";

// --- custom elements
import Separator from "./Separator.ce.vue";
export const UwSeparator = defineCustomElement(Separator);
