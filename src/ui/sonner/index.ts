// --- external
import { defineCustomElement } from "vue";
// --- internal
import Sonner from "./Sonner.ce.vue";
import config from "./sonner.config";
// --- utils
import { parseVariants } from "../../utils";

export { toast } from "vue-sonner";
export { default as Sonner } from "./Sonner.ce.vue";
export { type SonnerProps } from "./types";

export const UpmSonner = defineCustomElement(Sonner);

export const TOAST_VARIANTS = parseVariants(config.sonner);
