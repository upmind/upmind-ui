// --- external
import { keys } from "lodash-es";
import { defineCustomElement } from "vue";
export { toast } from "vue-sonner";

// --- vue elements
export { default as Sonner } from "./Sonner.ce.vue";
export { type SonnerProps } from "./types";

// --- custom elements
import Sonner from "./Sonner.ce.vue";
export const UpmSonner = defineCustomElement(Sonner);

// --- types
import config from "./sonner.config";
export const SONNER_VARIANTS = keys(config.sonner);
