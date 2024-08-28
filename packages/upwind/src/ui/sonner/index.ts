// --- external
import { defineCustomElement } from "vue";

// --- custom elements
import SonnerCE from "./Sonner.ce.vue";
export const UwSonner = defineCustomElement(SonnerCE);

// --- utils
export { toast } from "vue-sonner";
