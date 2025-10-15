// --- external
import { defineCustomElement } from "vue";
export { toast } from "vue-sonner";

// --- vue elements
export { default as Sonner } from "./Sonner.ce.vue";
export { type SonnerProps } from "./types";

// --- custom elements
import Sonner from "./Sonner.ce.vue";
export const UpmSonner = defineCustomElement(Sonner);

// --- types
export * from "./types";
