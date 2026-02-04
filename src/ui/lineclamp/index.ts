// --- external
import { defineCustomElement } from "vue";
// --- vue elements
export { default as Lineclamp } from "./Lineclamp.ce.vue";
// --- custom elements
import Lineclamp from "./Lineclamp.ce.vue";

export const UpmLineclamp = defineCustomElement(Lineclamp);
