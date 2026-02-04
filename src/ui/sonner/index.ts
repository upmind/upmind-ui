// --- external
import { defineCustomElement } from "vue";

export { toast } from "vue-sonner";
import { parseVariants } from "../../utils";
// --- vue elements
export { default as Sonner } from "./Sonner.ce.vue";
export { type SonnerProps } from "./types";
// --- custom elements
import Sonner from "./Sonner.ce.vue";

export const UpmSonner = defineCustomElement(Sonner);
// --- types
import config from "./sonner.config";

export const TOAST_VARIANTS = parseVariants(config.sonner);
